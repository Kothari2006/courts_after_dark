import mongoose from "mongoose";
import { notifyEquipmentIssued } from "./notification.service";
import connectToDatabase from "@/lib/mongodb";
import Equipment, {
  IEquipment,
  EquipmentCategory,
} from "@/models/Equipment";
import EquipmentCheckout, {
  IEquipmentCheckout,
} from "@/models/EquipmentCheckout";
import Booking, { IBooking } from "@/models/Booking";
import User from "@/models/User";

export interface CreateEquipmentParams {
  name: string;
  category: EquipmentCategory;
  description?: string;
  totalQuantity: number;
  status?: "AVAILABLE" | "UNAVAILABLE";
}

export interface UpdateEquipmentParams {
  name?: string;
  category?: EquipmentCategory;
  description?: string;
  totalQuantity?: number;
  availableQuantity?: number;
  damagedQuantity?: number;
  status?: "AVAILABLE" | "UNAVAILABLE";
}

export interface RequestEquipmentParams {
  userId: string;
  bookingId: string;
  items: Array<{ equipmentId: string; quantity: number }>;
  expectedReturnAt: string | Date;
  notes?: string;
}

export interface IssueEquipmentParams {
  checkoutId: string;
  managerId: string;
}

export interface ReturnEquipmentParams {
  checkoutId: string;
  managerId: string;
  damagedItems?: Array<{ equipmentId: string; damagedQuantity: number }>;
  notes?: string;
}

// In-process lock for equipment concurrency
const equipmentLocks = new Map<string, Promise<unknown>>();

async function withEquipmentLock<T>(lockKey: string, fn: () => Promise<T>): Promise<T> {
  const current = equipmentLocks.get(lockKey) || Promise.resolve();
  let release: () => void;
  const next = new Promise<void>((res) => {
    release = res;
  });
  equipmentLocks.set(lockKey, next);

  try {
    await current;
    return await fn();
  } finally {
    release!();
    if (equipmentLocks.get(lockKey) === next) {
      equipmentLocks.delete(lockKey);
    }
  }
}

/**
 * Creates a new equipment catalog item.
 */
export async function createEquipment(data: CreateEquipmentParams): Promise<IEquipment> {
  await connectToDatabase();

  const total = Math.max(0, data.totalQuantity);
  const equipment = await Equipment.create({
    name: data.name.trim(),
    category: data.category,
    description: data.description?.trim() || "",
    totalQuantity: total,
    availableQuantity: total,
    damagedQuantity: 0,
    status: data.status || "AVAILABLE",
  });

  return equipment;
}

/**
 * Updates an equipment item while preserving inventory invariants.
 */
export async function updateEquipment(
  id: string,
  data: UpdateEquipmentParams
): Promise<IEquipment> {
  await connectToDatabase();

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("INVALID_EQUIPMENT_ID");
  }

  const equipment = await Equipment.findById(id);
  if (!equipment) {
    throw new Error("EQUIPMENT_NOT_FOUND");
  }

  if (data.name !== undefined) equipment.name = data.name.trim();
  if (data.category !== undefined) equipment.category = data.category;
  if (data.description !== undefined) equipment.description = data.description.trim();
  if (data.status !== undefined) equipment.status = data.status;

  if (data.totalQuantity !== undefined) {
    const newTotal = Math.max(0, data.totalQuantity);
    const issued = equipment.totalQuantity - (equipment.availableQuantity + equipment.damagedQuantity);
    if (newTotal < issued + equipment.damagedQuantity) {
      throw new Error("TOTAL_LESS_THAN_OUTSTANDING");
    }
    equipment.totalQuantity = newTotal;
    equipment.availableQuantity = Math.max(0, newTotal - issued - equipment.damagedQuantity);
  }

  if (data.damagedQuantity !== undefined) {
    equipment.damagedQuantity = Math.max(0, data.damagedQuantity);
  }

  if (data.availableQuantity !== undefined) {
    equipment.availableQuantity = Math.max(0, data.availableQuantity);
  }

  // Final invariant check: available + damaged <= total
  if (equipment.availableQuantity + equipment.damagedQuantity > equipment.totalQuantity) {
    throw new Error("INVENTORY_INVARIANT_VIOLATED");
  }

  await equipment.save();
  return equipment;
}

/**
 * Deactivates an equipment item.
 */
export async function deactivateEquipment(id: string): Promise<IEquipment> {
  return await updateEquipment(id, { status: "UNAVAILABLE" });
}

/**
 * Retrieves equipment by ID.
 */
export async function getEquipmentById(id: string): Promise<IEquipment> {
  await connectToDatabase();

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("INVALID_EQUIPMENT_ID");
  }

  const equipment = await Equipment.findById(id).lean<IEquipment>();
  if (!equipment) {
    throw new Error("EQUIPMENT_NOT_FOUND");
  }

  return equipment;
}

/**
 * Retrieves equipment catalog with filtering and search.
 */
export async function getEquipmentList({
  category,
  search,
  status,
  page = 1,
  limit = 50,
}: {
  category?: string;
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  await connectToDatabase();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: any = {};

  if (category && category !== "ALL") {
    query.category = category.toUpperCase();
  }
  if (status && status !== "ALL") {
    query.status = status.toUpperCase();
  }
  if (search && search.trim()) {
    const regex = new RegExp(search.trim(), "i");
    query.$or = [{ name: regex }, { description: regex }];
  }

  const skip = (Math.max(1, page) - 1) * limit;

  const [items, total] = await Promise.all([
    Equipment.find(query).sort({ name: 1 }).skip(skip).limit(limit).lean<IEquipment[]>(),
    Equipment.countDocuments(query),
  ]);

  return {
    items,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

/**
 * Computes live inventory statistics across all items and checkouts.
 */
export async function getInventoryStats() {
  await connectToDatabase();

  const [allEquipment, pendingCount, activeCheckouts, overdueCount] = await Promise.all([
    Equipment.find().lean<IEquipment[]>(),
    EquipmentCheckout.countDocuments({ status: "REQUESTED" }),
    EquipmentCheckout.find({ status: "ISSUED" }).lean<IEquipmentCheckout[]>(),
    EquipmentCheckout.countDocuments({
      status: "ISSUED",
      expectedReturnAt: { $lt: new Date() },
    }),
  ]);

  let totalItems = 0;
  let availableItems = 0;
  let damagedItems = 0;

  for (const item of allEquipment) {
    totalItems += item.totalQuantity || 0;
    availableItems += item.availableQuantity || 0;
    damagedItems += item.damagedQuantity || 0;
  }

  const issuedItems = Math.max(0, totalItems - (availableItems + damagedItems));

  return {
    totalItems,
    availableItems,
    damagedItems,
    issuedItems,
    totalCatalogCount: allEquipment.length,
    pendingRequestsCount: pendingCount,
    activeCheckoutsCount: activeCheckouts.length,
    overdueCount,
  };
}

/**
 * Creates an equipment request associated with a student's confirmed facility booking.
 */
export async function requestEquipment({
  userId,
  bookingId,
  items,
  expectedReturnAt,
  notes,
}: RequestEquipmentParams): Promise<IEquipmentCheckout> {
  await connectToDatabase();

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("INVALID_USER_ID");
  }

  const requestingUser = await User.findById(userId).select("isActive");
  if (!requestingUser || !requestingUser.isActive) {
    throw new Error("USER_INACTIVE");
  }
  if (!mongoose.Types.ObjectId.isValid(bookingId)) {
    throw new Error("INVALID_BOOKING_ID");
  }
  if (!items || items.length === 0) {
    throw new Error("NO_ITEMS_REQUESTED");
  }

  // 1. Verify booking
  const booking = await Booking.findById(bookingId).lean<IBooking>();
  if (!booking) {
    throw new Error("BOOKING_NOT_FOUND");
  }
  if (booking.user.toString() !== userId.toString()) {
    throw new Error("BOOKING_NOT_OWNED");
  }
  if (booking.status !== "CONFIRMED") {
    throw new Error("BOOKING_NOT_CONFIRMED");
  }

  const returnDate = new Date(expectedReturnAt);
  if (isNaN(returnDate.getTime())) {
    throw new Error("INVALID_DATE_FORMAT");
  }

  const now = new Date();
  if (returnDate <= now) {
    throw new Error("RETURN_TIME_IN_PAST");
  }

  // 2. Validate requested equipment items
  const validatedItems: Array<{
    equipment: mongoose.Types.ObjectId;
    quantity: number;
    returnedQuantity: number;
    damagedQuantity: number;
  }> = [];

  for (const it of items) {
    if (!mongoose.Types.ObjectId.isValid(it.equipmentId)) {
      throw new Error("INVALID_EQUIPMENT_ID");
    }
    const qty = Math.max(1, it.quantity);

    const equip = await Equipment.findById(it.equipmentId).lean<IEquipment>();
    if (!equip) {
      throw new Error("EQUIPMENT_NOT_FOUND");
    }
    if (equip.status !== "AVAILABLE") {
      throw new Error("EQUIPMENT_INACTIVE");
    }
    if (equip.availableQuantity < qty) {
      throw new Error("INSUFFICIENT_STOCK");
    }

    validatedItems.push({
      equipment: new mongoose.Types.ObjectId(it.equipmentId),
      quantity: qty,
      returnedQuantity: 0,
      damagedQuantity: 0,
    });
  }

  // 3. Create equipment request (status = REQUESTED)
  const checkout = await EquipmentCheckout.create({
    user: new mongoose.Types.ObjectId(userId),
    booking: new mongoose.Types.ObjectId(bookingId),
    equipment: validatedItems[0].equipment,
    quantity: validatedItems[0].quantity,
    items: validatedItems,
    issuedAt: null,
    expectedReturnAt: returnDate,
    returnedAt: null,
    status: "REQUESTED",
    notes: notes?.trim() || "",
  });

  return checkout;
}

/**
 * Issues requested equipment to a student.
 * Atomically deducts inventory for each item with concurrency protection.
 */
export async function issueEquipment(
  params: IssueEquipmentParams
): Promise<IEquipmentCheckout> {
  const checkout = await issueEquipmentInternal(params);
  await notifyEquipmentIssued(checkout);
  return checkout;
}

async function issueEquipmentInternal({
  checkoutId,
  managerId,
}: IssueEquipmentParams): Promise<IEquipmentCheckout> {
  return withEquipmentLock(`checkout-${checkoutId}`, async () => {
    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(checkoutId)) {
      throw new Error("INVALID_CHECKOUT_ID");
    }
    if (!mongoose.Types.ObjectId.isValid(managerId)) {
      throw new Error("INVALID_MANAGER_ID");
    }

    const checkout = await EquipmentCheckout.findById(checkoutId);
    if (!checkout) {
      throw new Error("CHECKOUT_NOT_FOUND");
    }

    if (checkout.status !== "REQUESTED") {
      throw new Error("DUPLICATE_ISSUE");
    }

    const itemsToIssue =
      checkout.items && checkout.items.length > 0
        ? checkout.items
        : checkout.equipment
        ? [
            {
              equipment: checkout.equipment,
              quantity: checkout.quantity || 1,
              returnedQuantity: 0,
              damagedQuantity: 0,
            },
          ]
        : [];

    if (itemsToIssue.length === 0) {
      throw new Error("NO_ITEMS_IN_CHECKOUT");
    }

    // Determine transaction capability
    let useTransactions = false;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const topology = (mongoose.connection.getClient() as any)?.topology;
      const type = topology?.description?.type;
      useTransactions =
        type === "ReplicaSetWithPrimary" ||
        type === "Sharded" ||
        type === "LoadBalanced";
    } catch {
      useTransactions = false;
    }

    if (useTransactions) {
      let session: mongoose.ClientSession | null = null;
      try {
        session = await mongoose.startSession();
        session.startTransaction();

        for (const item of itemsToIssue) {
          // Atomically decrement availableQuantity with invariant condition: availableQuantity >= quantity
          const updated = await Equipment.findOneAndUpdate(
            {
              _id: item.equipment,
              availableQuantity: { $gte: item.quantity },
            },
            {
              $inc: { availableQuantity: -item.quantity },
            },
            { session, new: true }
          );

          if (!updated) {
            throw new Error("INSUFFICIENT_STOCK");
          }
        }

        checkout.status = "ISSUED";
        checkout.issuedAt = new Date();
        checkout.issuedBy = new mongoose.Types.ObjectId(managerId);
        await checkout.save({ session });

        await session.commitTransaction();
        return checkout;
      } catch (err) {
        if (session) {
          try {
            await session.abortTransaction();
          } catch {
            // ignore
          }
        }
        throw err;
      } finally {
        if (session) {
          await session.endSession();
        }
      }
    } else {
      // Standalone execution: Atomic conditional updates with rollback on failure
      const decremented: Array<{ equipmentId: mongoose.Types.ObjectId; qty: number }> = [];

      try {
        for (const item of itemsToIssue) {
          const updated = await Equipment.findOneAndUpdate(
            {
              _id: item.equipment,
              availableQuantity: { $gte: item.quantity },
            },
            {
              $inc: { availableQuantity: -item.quantity },
            },
            { new: true }
          );

          if (!updated) {
            throw new Error("INSUFFICIENT_STOCK");
          }

          decremented.push({ equipmentId: item.equipment, qty: item.quantity });
        }

        checkout.status = "ISSUED";
        checkout.issuedAt = new Date();
        checkout.issuedBy = new mongoose.Types.ObjectId(managerId);
        await checkout.save();

        return checkout;
      } catch (err) {
        // Rollback any inventory decrements that already occurred
        for (const dec of decremented) {
          await Equipment.findByIdAndUpdate(dec.equipmentId, {
            $inc: { availableQuantity: dec.qty },
          });
        }
        throw err;
      }
    }
  });
}

/**
 * Receives returned equipment from a student.
 * Undamaged items are restored to available inventory; damaged items increment damagedQuantity.
 */
export async function returnEquipment({
  checkoutId,
  managerId,
  damagedItems = [],
  notes,
}: ReturnEquipmentParams): Promise<IEquipmentCheckout> {
  return withEquipmentLock(`checkout-${checkoutId}`, async () => {
    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(checkoutId)) {
      throw new Error("INVALID_CHECKOUT_ID");
    }
    if (!mongoose.Types.ObjectId.isValid(managerId)) {
      throw new Error("INVALID_MANAGER_ID");
    }

    const checkout = await EquipmentCheckout.findById(checkoutId);
    if (!checkout) {
      throw new Error("CHECKOUT_NOT_FOUND");
    }

    if (checkout.status !== "ISSUED" && checkout.status !== "OVERDUE") {
      throw new Error("DUPLICATE_RETURN");
    }

    const itemsToReturn =
      checkout.items && checkout.items.length > 0
        ? checkout.items
        : checkout.equipment
        ? [
            {
              equipment: checkout.equipment,
              quantity: checkout.quantity || 1,
              returnedQuantity: 0,
              damagedQuantity: 0,
            },
          ]
        : [];

    let totalDamagedCount = 0;

    for (const item of itemsToReturn) {
      const equipIdStr = item.equipment.toString();
      const damageReport = damagedItems.find((d) => d.equipmentId === equipIdStr);
      const damagedQty = Math.min(item.quantity, Math.max(0, damageReport?.damagedQuantity || 0));
      const undamagedQty = Math.max(0, item.quantity - damagedQty);

      item.damagedQuantity = damagedQty;
      item.returnedQuantity = undamagedQty;
      totalDamagedCount += damagedQty;

      // Update Equipment inventory:
      // Undamaged returns increase availableQuantity.
      // Damaged returns increase damagedQuantity.
      await Equipment.findByIdAndUpdate(item.equipment, {
        $inc: {
          availableQuantity: undamagedQty,
          damagedQuantity: damagedQty,
        },
      });
    }

    checkout.status = totalDamagedCount > 0 ? "DAMAGED" : "RETURNED";
    checkout.returnedAt = new Date();
    checkout.returnedBy = new mongoose.Types.ObjectId(managerId);
    if (notes) {
      checkout.notes = checkout.notes ? `${checkout.notes} | ${notes.trim()}` : notes.trim();
    }

    await checkout.save();
    return checkout;
  });
}

/**
 * Retrieves overdue checkouts (status ISSUED and expectedReturnAt < now).
 */
export async function getOverdueCheckouts() {
  await connectToDatabase();

  const now = new Date();
  const overdueDocs = await EquipmentCheckout.find({
    status: "ISSUED",
    expectedReturnAt: { $lt: now },
  })
    .populate("user", "name email phoneNumber")
    .populate("booking", "bookingDate startTime endTime facility")
    .populate("items.equipment", "name category")
    .populate("equipment", "name category")
    .populate("issuedBy", "name email")
    .sort({ expectedReturnAt: 1 })
    .lean();

  return overdueDocs.map((doc) => {
    const returnAt = new Date(doc.expectedReturnAt);
    const overdueMinutes = Math.max(0, Math.round((now.getTime() - returnAt.getTime()) / (1000 * 60)));
    const overdueHours = Math.floor(overdueMinutes / 60);

    return {
      ...doc,
      overdueMinutes,
      overdueHours,
    };
  });
}

/**
 * Retrieves equipment checkout and request records for desk management.
 */
export async function getManagerCheckouts({
  status,
  page = 1,
  limit = 50,
}: {
  status?: string;
  page?: number;
  limit?: number;
}) {
  await connectToDatabase();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: any = {};
  if (status && status !== "ALL") {
    query.status = status.toUpperCase();
  }

  const skip = (Math.max(1, page) - 1) * limit;

  const [records, total] = await Promise.all([
    EquipmentCheckout.find(query)
      .populate("user", "name email phoneNumber role")
      .populate("booking", "bookingDate startTime endTime facility")
      .populate("items.equipment", "name category totalQuantity availableQuantity")
      .populate("equipment", "name category")
      .populate("issuedBy", "name email")
      .populate("returnedBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    EquipmentCheckout.countDocuments(query),
  ]);

  return {
    records,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

/**
 * Retrieves a student's own checkout and request history.
 */
export async function getStudentCheckouts(userId: string) {
  await connectToDatabase();

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("INVALID_USER_ID");
  }

  const requestingUser = await User.findById(userId).select("isActive");
  if (!requestingUser || !requestingUser.isActive) {
    throw new Error("USER_INACTIVE");
  }

  const checkouts = await EquipmentCheckout.find({
    user: new mongoose.Types.ObjectId(userId),
  })
    .populate({
      path: "booking",
      select: "bookingDate startTime endTime startAt endAt facility status",
      populate: { path: "facility", select: "name sportType" },
    })
    .populate("items.equipment", "name category")
    .populate("equipment", "name category")
    .populate("issuedBy", "name")
    .populate("returnedBy", "name")
    .sort({ createdAt: -1 })
    .lean();

  return checkouts;
}

/**
 * Retrieves a single checkout record with strict ownership or staff verification.
 */
export async function getCheckoutById(
  checkoutId: string,
  userId: string,
  isStaff: boolean
) {
  await connectToDatabase();

  if (!mongoose.Types.ObjectId.isValid(checkoutId)) {
    throw new Error("INVALID_CHECKOUT_ID");
  }

  const checkout = await EquipmentCheckout.findById(checkoutId)
    .populate("user", "name email phoneNumber")
    .populate("booking", "bookingDate startTime endTime facility status")
    .populate("items.equipment", "name category totalQuantity availableQuantity")
    .populate("equipment", "name category")
    .populate("issuedBy", "name email")
    .populate("returnedBy", "name email")
    .lean();

  if (!checkout) {
    throw new Error("CHECKOUT_NOT_FOUND");
  }

  // Ensure student cannot access another student's record
  const recordUserId =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (checkout.user as any)?._id?.toString() || (checkout.user as any)?.toString();

  if (!isStaff && recordUserId !== userId.toString()) {
    throw new Error("FORBIDDEN");
  }

  return checkout;
}
