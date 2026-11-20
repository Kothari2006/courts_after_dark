import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongodb";
import Booking, { IBooking, BookingType } from "@/models/Booking";
import Facility, { IFacility, SportType } from "@/models/Facility";
import User from "@/models/User";
import Maintenance from "@/models/Maintenance";
import BookingPolicy, { IBookingPolicy } from "@/models/BookingPolicy";
import Waitlist from "@/models/Waitlist";
import { BLOCKING_BOOKING_STATUSES, BLOCKING_MAINTENANCE_STATUSES, hasIntervalOverlap } from "./availability.service";
import {
  getUserPrimeTimeBookingsForDate,
  promoteNextWaitlistUser,
} from "./fairness.service";
import {
  notifyBookingCancelled,
  notifyBookingCompleted,
  notifyBookingConfirmed,
  notifyBookingRejected,
} from "./notification.service";

export interface CreateBookingParams {
  facilityId: string;
  startAt: string | Date;
  endAt: string | Date;
  userId: string;
}

export interface CancelBookingParams {
  bookingId: string;
  userId: string;
  isAdmin?: boolean;
  reason?: string;
}

export interface GetUserBookingsParams {
  userId: string;
  filter?: "ALL" | "UPCOMING" | "COMPLETED" | "CANCELLED";
  page?: number;
  limit?: number;
}

export const DEFAULT_BOOKING_POLICY = {
  maxActiveBookings: 2,
  maxAdvanceBookingDays: 7,
  maxBookingDurationMinutes: 60,
  cancellationDeadlineHours: 2,
  maxPrimeTimeBookingsPerDay: 1,
  primeTimeStart: "18:00",
  primeTimeEnd: "21:00",
  enableWaitlist: true,
  enableNoShowTracking: true,
  isActive: true,
};

/**
 * Loads the active booking policy or falls back to system defaults.
 */
export async function getActiveBookingPolicy(): Promise<{
  maxActiveBookings: number;
  maxAdvanceBookingDays: number;
  maxBookingDurationMinutes: number;
  cancellationDeadlineHours: number;
  maxPrimeTimeBookingsPerDay: number;
  primeTimeStart: string;
  primeTimeEnd: string;
  enableWaitlist: boolean;
  enableNoShowTracking: boolean;
}> {
  try {
    const policy = await BookingPolicy.findOne({ isActive: true }).lean<IBookingPolicy>();
    if (policy) {
      return {
        maxActiveBookings: policy.maxActiveBookings ?? DEFAULT_BOOKING_POLICY.maxActiveBookings,
        maxAdvanceBookingDays: policy.maxAdvanceBookingDays ?? DEFAULT_BOOKING_POLICY.maxAdvanceBookingDays,
        maxBookingDurationMinutes: policy.maxBookingDurationMinutes ?? DEFAULT_BOOKING_POLICY.maxBookingDurationMinutes,
        cancellationDeadlineHours: policy.cancellationDeadlineHours ?? DEFAULT_BOOKING_POLICY.cancellationDeadlineHours,
        maxPrimeTimeBookingsPerDay: policy.maxPrimeTimeBookingsPerDay ?? DEFAULT_BOOKING_POLICY.maxPrimeTimeBookingsPerDay,
        primeTimeStart: policy.primeTimeStart || DEFAULT_BOOKING_POLICY.primeTimeStart,
        primeTimeEnd: policy.primeTimeEnd || DEFAULT_BOOKING_POLICY.primeTimeEnd,
        enableWaitlist: policy.enableWaitlist ?? DEFAULT_BOOKING_POLICY.enableWaitlist,
        enableNoShowTracking: policy.enableNoShowTracking ?? DEFAULT_BOOKING_POLICY.enableNoShowTracking,
      };
    }
  } catch {
    // Fall back to default
  }
  return DEFAULT_BOOKING_POLICY;
}

/**
 * Extracts local date (YYYY-MM-DD) and time (HH:mm) parts given a Date and IANA timezone.
 */
export function formatInTimezone(date: Date, timezone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  let year = "";
  let month = "";
  let day = "";
  let hour = "";
  let minute = "";

  for (const p of parts) {
    if (p.type === "year") year = p.value;
    if (p.type === "month") month = p.value;
    if (p.type === "day") day = p.value;
    if (p.type === "hour") hour = p.value === "24" ? "00" : p.value;
    if (p.type === "minute") minute = p.value;
  }

  const dateStr = `${year}-${month}-${day}`;
  const timeStr = `${hour}:${minute}`;

  return { dateStr, timeStr, year, month, day, hour, minute };
}

/**
 * Converts "HH:mm" time string into total minutes from midnight.
 */
function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

// In-process concurrency mutex to serialize simultaneous requests for the same facility
export const facilityLockChains = new Map<string, Promise<unknown>>();

export async function withFacilityLock<T>(facilityId: string, fn: () => Promise<T>): Promise<T> {
  const currentLock = facilityLockChains.get(facilityId) || Promise.resolve();
  let release: () => void;
  const nextLock = new Promise<void>((resolve) => {
    release = resolve;
  });

  facilityLockChains.set(facilityId, nextLock);

  try {
    await currentLock;
    return await fn();
  } finally {
    release!();
    if (facilityLockChains.get(facilityId) === nextLock) {
      facilityLockChains.delete(facilityId);
    }
  }
}

/**
 * Creates a facility reservation with concurrency control and strict policy enforcement.
 */
export async function createBooking(params: CreateBookingParams): Promise<IBooking> {
  const booking = await createBookingInternal(params);
  await notifyBookingConfirmed(booking);
  return booking;
}

async function createBookingInternal({
  facilityId,
  startAt,
  endAt,
  userId,
}: CreateBookingParams): Promise<IBooking> {
  return withFacilityLock(facilityId, async () => {
    await connectToDatabase();

  if (!mongoose.Types.ObjectId.isValid(facilityId)) {
    throw new Error("INVALID_FACILITY_ID");
  }
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("INVALID_USER_ID");
  }

  const bookingUser = await User.findById(userId).select("isActive");
  if (!bookingUser || !bookingUser.isActive) {
    throw new Error("USER_INACTIVE");
  }

  const startDate = new Date(startAt);
  const endDate = new Date(endAt);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new Error("INVALID_DATE_FORMAT");
  }

  if (endDate <= startDate) {
    throw new Error("INVALID_TIME_RANGE");
  }

  const now = new Date();
  if (startDate.getTime() <= now.getTime()) {
    throw new Error("CANNOT_BOOK_PAST");
  }

  const policy = await getActiveBookingPolicy();

  // 1. Duration check
  const durationMinutes = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));
  if (durationMinutes > policy.maxBookingDurationMinutes) {
    throw new Error("EXCEEDS_MAX_DURATION");
  }

  // 2. Advance booking check
  const maxAdvanceMs = policy.maxAdvanceBookingDays * 24 * 60 * 60 * 1000;
  if (startDate.getTime() - now.getTime() > maxAdvanceMs) {
    throw new Error("EXCEEDS_ADVANCE_WINDOW");
  }

  // 3. Facility status and operating hours check
  const facility = await Facility.findById(facilityId).lean<IFacility>();
  if (!facility) {
    throw new Error("FACILITY_NOT_FOUND");
  }
  if (facility.status !== "ACTIVE") {
    throw new Error("FACILITY_NOT_ACTIVE");
  }

  const timezone = facility.timezone || "Asia/Kolkata";
  const startLocal = formatInTimezone(startDate, timezone);
  const endLocal = formatInTimezone(endDate, timezone);

  // Check operating hours in local representation
  const openMinutes = timeToMinutes(facility.operatingHours.open);
  let closeMinutes = timeToMinutes(facility.operatingHours.close);
  if (closeMinutes === 0 || closeMinutes <= openMinutes) {
    closeMinutes = 24 * 60;
  }

  const slotStartMinutes = timeToMinutes(startLocal.timeStr);
  let slotEndMinutes = timeToMinutes(endLocal.timeStr);
  if (slotEndMinutes === 0 || slotEndMinutes < slotStartMinutes) {
    slotEndMinutes = 24 * 60;
  }

  if (slotStartMinutes < openMinutes || slotEndMinutes > closeMinutes) {
    throw new Error("OUTSIDE_OPERATING_HOURS");
  }

  // Determine booking type (PRIME_TIME vs REGULAR)
  const primeStartMinutes = timeToMinutes(policy.primeTimeStart);
  const primeEndMinutes = timeToMinutes(policy.primeTimeEnd);
  const isPrimeTime =
    hasIntervalOverlap(
      slotStartMinutes,
      slotEndMinutes,
      primeStartMinutes,
      primeEndMinutes
    );
  const bookingType: BookingType = isPrimeTime ? "PRIME_TIME" : "REGULAR";

  // Booking Date (Local day at midnight UTC)
  const [bYear, bMonth, bDay] = startLocal.dateStr.split("-").map(Number);
  const bookingDate = new Date(Date.UTC(bYear, bMonth - 1, bDay));

  const runChecksAndCreate = async (session: mongoose.ClientSession | null): Promise<IBooking> => {
    // 4. Check active booking limit per student
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const activeBookingQuery: any = {
      user: new mongoose.Types.ObjectId(userId),
      status: { $in: ["CONFIRMED", "PENDING"] },
      endAt: { $gt: now },
    };

    const activeCount = session
      ? await Booking.countDocuments(activeBookingQuery).session(session)
      : await Booking.countDocuments(activeBookingQuery);

    if (activeCount >= policy.maxActiveBookings) {
      throw new Error("MAX_ACTIVE_BOOKINGS_EXCEEDED");
    }

    // 4b. Check prime-time fair allocation (max 1 prime-time booking per day per student)
    if (isPrimeTime) {
      const primeBookingsToday = await getUserPrimeTimeBookingsForDate(
        userId,
        startLocal.dateStr,
        timezone
      );

      if (primeBookingsToday >= policy.maxPrimeTimeBookingsPerDay) {
        throw new Error("PRIME_TIME_LIMIT_EXCEEDED");
      }
    }

    // 5. Check overlapping bookings (Double-booking prevention)
    // Overlap condition: startAt < requestedEnd && endAt > requestedStart
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bookingConflictQuery: any = {
      facility: new mongoose.Types.ObjectId(facilityId),
      status: { $in: BLOCKING_BOOKING_STATUSES },
      startAt: { $lt: endDate },
      endAt: { $gt: startDate },
    };

    const existingConflict = session
      ? await Booking.findOne(bookingConflictQuery).session(session)
      : await Booking.findOne(bookingConflictQuery);

    if (existingConflict) {
      throw new Error("SLOT_ALREADY_BOOKED");
    }

    // 6. Check overlapping maintenance
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const maintenanceConflictQuery: any = {
      facility: new mongoose.Types.ObjectId(facilityId),
      status: { $in: BLOCKING_MAINTENANCE_STATUSES },
      startAt: { $lt: endDate },
      endAt: { $gt: startDate },
    };

    const maintenanceConflict = session
      ? await Maintenance.findOne(maintenanceConflictQuery).session(session)
      : await Maintenance.findOne(maintenanceConflictQuery);

    if (maintenanceConflict) {
      throw new Error("FACILITY_UNDER_MAINTENANCE");
    }

    // 7. Create confirmed booking
    const bookingPayload = {
      user: new mongoose.Types.ObjectId(userId),
      facility: new mongoose.Types.ObjectId(facilityId),
      bookingDate,
      startTime: startLocal.timeStr,
      endTime: endLocal.timeStr,
      startAt: startDate,
      endAt: endDate,
      status: "CONFIRMED" as const,
      bookingType,
    };

    if (session) {
      const createdDocs = await Booking.create([bookingPayload], { session });
      return createdDocs[0];
    } else {
      return await Booking.create(bookingPayload);
    }
  };

  // Check if replica set transactions are supported by deployment
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

      // Write lock on facility document to serialize concurrent requests
      await Facility.findOneAndUpdate(
        { _id: facilityId },
        { $inc: { __v: 0 } },
        { session }
      );

      const booking = await runChecksAndCreate(session);
      await session.commitTransaction();
      return booking;
    } catch (err: unknown) {
      if (session) {
        try {
          await session.abortTransaction();
        } catch {
          // ignore abort failure
        }
      }
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.includes("does not support retryable writes") ||
        msg.includes("Transaction numbers are only allowed") ||
        msg.includes("replica set")
      ) {
        return await runChecksAndCreate(null);
      }
      throw err;
    } finally {
      if (session) {
        await session.endSession();
      }
    }
  }

    // Fallback for standalone MongoDB deployment
    try {
      return await runChecksAndCreate(null);
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((err as any)?.code === 11000) {
        throw new Error("SLOT_ALREADY_BOOKED");
      }
      throw err;
    }
  });
}

/**
 * Cancels a booking, enforcing ownership or admin privileges and the 2-hour deadline.
 */
export async function cancelBooking({
  bookingId,
  userId,
  isAdmin = false,
  reason,
}: CancelBookingParams): Promise<IBooking> {
  await connectToDatabase();

  if (!mongoose.Types.ObjectId.isValid(bookingId)) {
    throw new Error("INVALID_BOOKING_ID");
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new Error("BOOKING_NOT_FOUND");
  }

  // Permission check: student can only cancel own booking, admin can cancel any
  if (!isAdmin && booking.user.toString() !== userId.toString()) {
    throw new Error("FORBIDDEN");
  }

  if (booking.status === "COMPLETED") {
    throw new Error("CANNOT_CANCEL_COMPLETED");
  }

  if (booking.status === "CANCELLED") {
    throw new Error("ALREADY_CANCELLED");
  }

  if (booking.status === "REJECTED") {
    throw new Error("CANNOT_CANCEL_REJECTED");
  }

  const now = new Date();

  // Cancellation deadline: at least 2 hours before startAt (unless admin)
  if (!isAdmin) {
    const policy = await getActiveBookingPolicy();
    const hoursUntilStart = (booking.startAt.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilStart < policy.cancellationDeadlineHours) {
      throw new Error("CANCELLATION_DEADLINE_EXCEEDED");
    }
  }

  booking.status = "CANCELLED";
  booking.cancelledAt = now;
  booking.cancellationReason = reason?.trim() || "Cancelled by user";
  await booking.save();
  await notifyBookingCancelled(booking, booking.cancellationReason);

  // Task 6: Automatic Waiting List Promotion
  // When a booking is cancelled, check if eligible candidates are waiting for this court slot
  try {
    await promoteNextWaitlistUser({
      facilityId: booking.facility,
      startAt: booking.startAt,
      endAt: booking.endAt,
    });
  } catch (promoErr) {
    console.error("Waitlist auto-promotion background error:", promoErr);
  }

  return booking;
}

/**
 * Retrieves paginated bookings for a student with status tab filtering.
 */
export async function getUserBookings({
  userId,
  filter = "ALL",
  page = 1,
  limit = 10,
}: GetUserBookingsParams) {
  await connectToDatabase();

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("INVALID_USER_ID");
  }

  const bookingUser = await User.findById(userId).select("isActive");
  if (!bookingUser || !bookingUser.isActive) {
    throw new Error("USER_INACTIVE");
  }

  const now = new Date();
  const policy = await getActiveBookingPolicy();

  // Query condition by tab filter
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: any = { user: new mongoose.Types.ObjectId(userId) };

  if (filter === "UPCOMING") {
    query.status = { $in: ["CONFIRMED", "PENDING"] };
    query.endAt = { $gt: now };
  } else if (filter === "COMPLETED") {
    query.$or = [
      { status: "COMPLETED" },
      { status: { $in: ["CONFIRMED", "PENDING"] }, endAt: { $lte: now } },
    ];
  } else if (filter === "CANCELLED") {
    query.status = { $in: ["CANCELLED", "REJECTED"] };
  }

  const sortOrder: Record<string, 1 | -1> =
    filter === "UPCOMING" ? { startAt: 1 } : { startAt: -1 };

  const skip = (Math.max(1, page) - 1) * limit;

  const [bookings, totalCount, activeBookingsCount] = await Promise.all([
    Booking.find(query)
      .populate("facility", "name sportType location images operatingHours slotDuration")
      .sort(sortOrder)
      .skip(skip)
      .limit(limit)
      .lean(),
    Booking.countDocuments(query),
    Booking.countDocuments({
      user: new mongoose.Types.ObjectId(userId),
      status: { $in: ["CONFIRMED", "PENDING"] },
      endAt: { $gt: now },
    }),
  ]);

  return {
    bookings,
    pagination: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit) || 1,
    },
    quota: {
      activeCount: activeBookingsCount,
      maxActive: policy.maxActiveBookings,
      remaining: Math.max(0, policy.maxActiveBookings - activeBookingsCount),
    },
  };
}

/**
 * Retrieves a single booking by ID with ownership verification.
 */
export async function getBookingById(
  bookingId: string,
  userId: string,
  isAdmin = false
) {
  await connectToDatabase();

  if (!mongoose.Types.ObjectId.isValid(bookingId)) {
    throw new Error("INVALID_BOOKING_ID");
  }

  const booking = await Booking.findById(bookingId)
    .populate("facility", "name sportType location images operatingHours slotDuration")
    .populate("user", "name email role")
    .lean();

  if (!booking) {
    throw new Error("BOOKING_NOT_FOUND");
  }

  // Ensure requester is owner or admin
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bookingUserId = (booking.user as any)?._id?.toString() || (booking.user as any)?.toString();
  if (!isAdmin && bookingUserId !== userId.toString()) {
    throw new Error("FORBIDDEN");
  }

  return booking;
}

export interface AdminBookingsFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  facilityId?: string;
  sportType?: string;
  bookingType?: string;
  startDate?: string;
  endDate?: string;
  sort?: string;
}

export interface AdminBookingStats {
  total: number;
  confirmed: number;
  pending: number;
  cancelled: number;
  completed: number;
  rejected: number;
}

export interface UpdateBookingStatusAdminParams {
  bookingId: string;
  status: "CONFIRMED" | "CANCELLED" | "REJECTED" | "COMPLETED";
  reason?: string;
  adminId: string;
}

/**
 * Retrieves aggregate booking statistics for the admin dashboard.
 */
export async function getAdminBookingStats(): Promise<AdminBookingStats> {
  await connectToDatabase();

  const counts = await Booking.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const stats: AdminBookingStats = {
    total: 0,
    confirmed: 0,
    pending: 0,
    cancelled: 0,
    completed: 0,
    rejected: 0,
  };

  for (const c of counts) {
    stats.total += c.count;
    if (c._id === "CONFIRMED") stats.confirmed = c.count;
    else if (c._id === "PENDING") stats.pending = c.count;
    else if (c._id === "CANCELLED") stats.cancelled = c.count;
    else if (c._id === "COMPLETED") stats.completed = c.count;
    else if (c._id === "REJECTED") stats.rejected = c.count;
  }

  return stats;
}

/**
 * Lists bookings with full server-side filtering, searching, sorting and pagination for administrators.
 */
export async function getAdminBookings(params: AdminBookingsFilterParams) {
  await connectToDatabase();

  const {
    page = 1,
    limit = 20,
    search = "",
    status = "ALL",
    facilityId,
    sportType,
    bookingType = "ALL",
    startDate,
    endDate,
    sort = "startAt:desc",
  } = params;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: any = {};

  if (status && status !== "ALL") {
    query.status = status;
  }

  if (bookingType && bookingType !== "ALL") {
    query.bookingType = bookingType;
  }

  if (facilityId && mongoose.Types.ObjectId.isValid(facilityId)) {
    query.facility = new mongoose.Types.ObjectId(facilityId);
  }

  if (sportType && sportType !== "ALL") {
    const facilitiesWithSport = await Facility.find({ sportType: sportType as SportType })
      .select("_id")
      .lean<{ _id: mongoose.Types.ObjectId }[]>();
    const facilityIds = facilitiesWithSport.map((f) => f._id);
    if (query.facility) {
      const matches = facilityIds.some((id) => id.toString() === query.facility.toString());
      if (!matches) {
        query.facility = new mongoose.Types.ObjectId();
      }
    } else {
      query.facility = { $in: facilityIds };
    }
  }

  if (startDate) {
    const start = new Date(startDate);
    if (!isNaN(start.getTime())) {
      query.startAt = { ...(query.startAt || {}), $gte: start };
    }
  }

  if (endDate) {
    const end = new Date(endDate);
    if (!isNaN(end.getTime())) {
      query.endAt = { ...(query.endAt || {}), $lte: end };
    }
  }

  if (search && search.trim()) {
    const term = search.trim();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const searchConditions: any[] = [];

    if (mongoose.Types.ObjectId.isValid(term)) {
      searchConditions.push({ _id: new mongoose.Types.ObjectId(term) });
    }

    const regex = new RegExp(term, "i");

    const matchedUsers = await User.find({
      $or: [{ name: regex }, { email: regex }],
    })
      .select("_id")
      .lean<{ _id: mongoose.Types.ObjectId }[]>();
    if (matchedUsers.length > 0) {
      searchConditions.push({ user: { $in: matchedUsers.map((u) => u._id) } });
    }

    const matchedFacilities = await Facility.find({ name: regex })
      .select("_id")
      .lean<{ _id: mongoose.Types.ObjectId }[]>();
    if (matchedFacilities.length > 0) {
      searchConditions.push({ facility: { $in: matchedFacilities.map((f) => f._id) } });
    }

    if (searchConditions.length > 0) {
      query.$or = searchConditions;
    } else {
      return {
        bookings: [],
        pagination: {
          total: 0,
          page,
          limit,
          totalPages: 1,
        },
        stats: await getAdminBookingStats(),
      };
    }
  }

  const sortMap: Record<string, 1 | -1> = {};
  const [field, direction] = (sort || "startAt:desc").split(":");
  const validFields = ["startAt", "createdAt", "bookingDate"];
  const sortField = validFields.includes(field) ? field : "startAt";
  sortMap[sortField] = direction === "asc" ? 1 : -1;

  const skip = (Math.max(1, page) - 1) * limit;

  const [bookings, total, stats] = await Promise.all([
    Booking.find(query)
      .populate("user", "name email phoneNumber role")
      .populate("facility", "name sportType location operatingHours slotDuration")
      .populate("markedNoShowBy", "name email")
      .populate("markedCheckInBy", "name email")
      .sort(sortMap)
      .skip(skip)
      .limit(limit)
      .lean(),
    Booking.countDocuments(query),
    getAdminBookingStats(),
  ]);

  return {
    bookings,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
    stats,
  };
}

/**
 * Retrieves comprehensive booking details including student, facility and waitlist info.
 */
export async function getAdminBookingDetails(bookingId: string) {
  await connectToDatabase();

  if (!mongoose.Types.ObjectId.isValid(bookingId)) {
    throw new Error("INVALID_BOOKING_ID");
  }

  const booking = await Booking.findById(bookingId)
    .populate("user", "name email phoneNumber role createdAt")
    .populate("facility", "name sportType location operatingHours slotDuration timezone images")
    .populate("markedNoShowBy", "name email")
    .populate("markedCheckInBy", "name email")
    .lean();

  if (!booking) {
    throw new Error("BOOKING_NOT_FOUND");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const facilityId = (booking.facility as any)?._id || booking.facility;
  const waitlist = await Waitlist.find({
    facility: facilityId,
    startAt: booking.startAt,
    endAt: booking.endAt,
    status: "WAITING",
  })
    .populate("user", "name email phoneNumber role")
    .sort({ position: 1 })
    .lean();

  return {
    booking,
    waitlist,
  };
}

/**
 * Handles administrative booking status transitions with conflict revalidation and waitlist promotion.
 */
export async function updateBookingStatusByAdmin({
  bookingId,
  status,
  reason,
  adminId,
}: UpdateBookingStatusAdminParams) {
  await connectToDatabase();

  if (!mongoose.Types.ObjectId.isValid(bookingId)) {
    throw new Error("INVALID_BOOKING_ID");
  }
  if (!mongoose.Types.ObjectId.isValid(adminId)) {
    throw new Error("INVALID_ADMIN_ID");
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new Error("BOOKING_NOT_FOUND");
  }

  if (booking.status === "CANCELLED") {
    throw new Error("CANNOT_MODIFY_CANCELLED");
  }
  if (booking.status === "REJECTED") {
    throw new Error("CANNOT_MODIFY_REJECTED");
  }
  if (booking.status === "COMPLETED") {
    throw new Error("CANNOT_MODIFY_COMPLETED");
  }

  if (status === "CANCELLED") {
    if (!reason || reason.trim().length < 3) {
      throw new Error("CANCELLATION_REASON_REQUIRED");
    }
    return await cancelBooking({
      bookingId,
      userId: adminId,
      isAdmin: true,
      reason: reason.trim(),
    });
  }

  if (status === "CONFIRMED") {
    if (booking.status === "CONFIRMED") {
      return booking;
    }
    if (booking.status !== "PENDING") {
      throw new Error("INVALID_STATUS_TRANSITION");
    }

    return await withFacilityLock(booking.facility.toString(), async () => {
      const facility = await Facility.findById(booking.facility).lean<IFacility>();
      if (!facility) {
        throw new Error("FACILITY_NOT_FOUND");
      }
      if (facility.status !== "ACTIVE") {
        throw new Error("FACILITY_NOT_ACTIVE");
      }

      const conflictBooking = await Booking.findOne({
        _id: { $ne: booking._id },
        facility: booking.facility,
        status: { $in: BLOCKING_BOOKING_STATUSES },
        startAt: { $lt: booking.endAt },
        endAt: { $gt: booking.startAt },
      });

      if (conflictBooking) {
        throw new Error("SLOT_ALREADY_BOOKED");
      }

      const conflictMaintenance = await Maintenance.findOne({
        facility: booking.facility,
        status: { $in: BLOCKING_MAINTENANCE_STATUSES },
        startAt: { $lt: booking.endAt },
        endAt: { $gt: booking.startAt },
      });

      if (conflictMaintenance) {
        throw new Error("FACILITY_UNDER_MAINTENANCE");
      }

      booking.status = "CONFIRMED";
      await booking.save();
      await notifyBookingConfirmed(booking);
      return booking;
    });
  }

  if (status === "REJECTED") {
    if (booking.status !== "PENDING") {
      throw new Error("INVALID_STATUS_TRANSITION");
    }
    booking.status = "REJECTED";
    booking.cancellationReason = reason?.trim() || "Rejected by administrator";
    booking.cancelledAt = new Date();
    await booking.save();
    await notifyBookingRejected(booking, booking.cancellationReason);
    return booking;
  }

  if (status === "COMPLETED") {
    if (booking.status !== "CONFIRMED") {
      throw new Error("INVALID_STATUS_TRANSITION");
    }
    booking.status = "COMPLETED";
    await booking.save();
    await notifyBookingCompleted(booking);
    return booking;
  }

  throw new Error("INVALID_STATUS_TRANSITION");
}
