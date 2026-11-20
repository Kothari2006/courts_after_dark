import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongodb";
import User, { IUser, UserRole } from "@/models/User";
import Booking from "@/models/Booking";
import EquipmentCheckout from "@/models/EquipmentCheckout";
import AuditLog, { IAuditLog } from "@/models/AuditLog";
import { ListUsersQueryInput } from "@/lib/validations/user";

interface PopulatedBookingDetails {
  _id: { toString(): string } | string;
  facility?: { name?: string; sportType?: string; location?: string } | null;
  startAt?: Date;
  endAt?: Date;
  status: string;
  createdAt?: Date;
}

interface PopulatedCheckoutDetails {
  _id: { toString(): string } | string;
  equipment?: { name?: string } | null;
  items?: Array<{ equipment?: { name?: string } | null }>;
  status: string;
  expectedReturnAt?: Date;
  returnedAt?: Date;
  createdAt?: Date;
}

interface PopulatedAuditDetails {
  _id: { toString(): string } | string;
  actionType: string;
  previousValue: string;
  newValue: string;
  reason?: string;
  admin?: { name?: string; email?: string } | null;
  createdAt?: Date;
}

export interface SafeUserSummary {
  _id: string;
  name: string;
  email: string;
  phoneNumber?: string | null;
  role: UserRole;
  isActive: boolean;
  bookingCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ListUsersResult {
  users: SafeUserSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserDetailsResult {
  user: {
    _id: string;
    name: string;
    email: string;
    phoneNumber?: string | null;
    role: UserRole;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
  stats: {
    totalBookings: number;
    totalCheckouts: number;
  };
  recentBookings: Array<{
    _id: string;
    facilityName: string;
    sportType: string;
    location?: string;
    startAt: string;
    endAt: string;
    status: string;
    createdAt: string;
  }>;
  recentCheckouts: Array<{
    _id: string;
    equipmentNames: string;
    status: string;
    expectedReturnAt: string;
    returnedAt?: string | null;
    createdAt: string;
  }>;
  auditHistory: Array<{
    _id: string;
    actionType: string;
    previousValue: string;
    newValue: string;
    reason?: string;
    adminName: string;
    adminEmail: string;
    createdAt: string;
  }>;
}

/**
 * Escapes characters with special meaning in regular expressions.
 */
function escapeRegex(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

/**
 * Fetches a paginated, searchable, filterable list of users for administration.
 */
export async function listUsers(
  params: ListUsersQueryInput
): Promise<ListUsersResult> {
  await connectToDatabase();

  const { search, role, status, page = 1, limit = 10, sort = "desc" } = params;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: any = {};

  if (search && search.trim() !== "") {
    const escaped = escapeRegex(search.trim());
    query.$or = [
      { name: { $regex: escaped, $options: "i" } },
      { email: { $regex: escaped, $options: "i" } },
    ];
  }

  if (role && role !== "ALL") {
    query.role = role;
  }

  if (status === "ACTIVE") {
    query.isActive = true;
  } else if (status === "INACTIVE") {
    query.isActive = false;
  }

  const skip = (page - 1) * limit;
  const sortDirection = sort === "asc" ? 1 : -1;

  const [total, userDocs] = await Promise.all([
    User.countDocuments(query),
    User.find(query)
      .select("_id name email phoneNumber role isActive createdAt updatedAt")
      .sort({ createdAt: sortDirection })
      .skip(skip)
      .limit(limit)
      .lean<IUser[]>(),
  ]);

  const userIds = userDocs.map((u) => u._id);

  // Compute booking count efficiently via aggregation
  const bookingCounts =
    userIds.length > 0
      ? await Booking.aggregate([
          { $match: { user: { $in: userIds } } },
          { $group: { _id: "$user", count: { $sum: 1 } } },
        ])
      : [];

  const bookingCountMap = new Map<string, number>();
  for (const item of bookingCounts) {
    bookingCountMap.set(item._id.toString(), item.count);
  }

  const users: SafeUserSummary[] = userDocs.map((u) => ({
    _id: u._id.toString(),
    name: u.name,
    email: u.email,
    phoneNumber: u.phoneNumber || null,
    role: u.role,
    isActive: Boolean(u.isActive),
    bookingCount: bookingCountMap.get(u._id.toString()) || 0,
    createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : "",
    updatedAt: u.updatedAt ? new Date(u.updatedAt).toISOString() : "",
  }));

  const totalPages = Math.ceil(total / limit) || 1;

  return {
    users,
    total,
    page,
    limit,
    totalPages,
  };
}

/**
 * Retrieves safe profile details, booking history, checkout history, and audit records.
 */
export async function getUserDetails(
  userId: string
): Promise<UserDetailsResult> {
  await connectToDatabase();

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("INVALID_USER_ID");
  }

  const user = await User.findById(userId)
    .select("_id name email phoneNumber role isActive createdAt updatedAt")
    .lean<IUser>();

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  const userObjId = new mongoose.Types.ObjectId(userId);

  // Fetch booking stats and recent history
  const [
    totalBookings,
    recentBookingsDocs,
    totalCheckouts,
    recentCheckoutsDocs,
    auditDocs,
  ] = await Promise.all([
    Booking.countDocuments({ user: userObjId }),
    Booking.find({ user: userObjId })
      .populate("facility", "name sportType location")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean<PopulatedBookingDetails[]>(),
    EquipmentCheckout.countDocuments({ user: userObjId }),
    EquipmentCheckout.find({ user: userObjId })
      .populate("equipment", "name")
      .populate("items.equipment", "name")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean<PopulatedCheckoutDetails[]>(),
    AuditLog.find({ targetUser: userObjId })
      .populate("admin", "name email")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean<PopulatedAuditDetails[]>(),
  ]);

  const recentBookings = recentBookingsDocs.map((b) => ({
    _id: b._id.toString(),
    facilityName: b.facility?.name || "Facility",
    sportType: b.facility?.sportType || "Sports",
    location: b.facility?.location || "",
    startAt: b.startAt ? new Date(b.startAt).toISOString() : "",
    endAt: b.endAt ? new Date(b.endAt).toISOString() : "",
    status: b.status,
    createdAt: b.createdAt ? new Date(b.createdAt).toISOString() : "",
  }));

  const recentCheckouts = recentCheckoutsDocs.map((c) => {
    const names = (c.items || []).map((i) => i.equipment?.name).filter(Boolean);
    const equipNames =
      names.length > 0
        ? names.join(", ")
        : c.equipment?.name || "Equipment item";

    return {
      _id: c._id.toString(),
      equipmentNames: equipNames,
      status: c.status,
      expectedReturnAt: c.expectedReturnAt
        ? new Date(c.expectedReturnAt).toISOString()
        : "",
      returnedAt: c.returnedAt ? new Date(c.returnedAt).toISOString() : null,
      createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : "",
    };
  });

  const auditHistory = auditDocs.map((a) => ({
    _id: a._id.toString(),
    actionType: a.actionType,
    previousValue: a.previousValue,
    newValue: a.newValue,
    reason: a.reason || "",
    adminName: a.admin?.name || "Administrator",
    adminEmail: a.admin?.email || "admin@courtsafterdark.com",
    createdAt: a.createdAt ? new Date(a.createdAt).toISOString() : "",
  }));

  return {
    user: {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber || null,
      role: user.role,
      isActive: Boolean(user.isActive),
      createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : "",
      updatedAt: user.updatedAt ? new Date(user.updatedAt).toISOString() : "",
    },
    stats: {
      totalBookings,
      totalCheckouts,
    },
    recentBookings,
    recentCheckouts,
    auditHistory,
  };
}

/**
 * Updates a user's role with last-active-admin protection and audit logging.
 */
export async function updateUserRole({
  adminId,
  targetUserId,
  newRole,
  reason = "",
}: {
  adminId: string;
  targetUserId: string;
  newRole: UserRole;
  reason?: string;
}): Promise<{ user: SafeUserSummary; audit: IAuditLog }> {
  await connectToDatabase();

  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    throw new Error("INVALID_USER_ID");
  }

  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    throw new Error("USER_NOT_FOUND");
  }

  // Prevent demoting the last active administrator
  if (targetUser.role === "ADMIN" && newRole !== "ADMIN") {
    const otherActiveAdmin = await User.findOne({
      role: "ADMIN",
      isActive: true,
      _id: { $ne: targetUser._id },
    });

    if (!otherActiveAdmin) {
      throw new Error("CANNOT_DEMOTE_LAST_ADMIN");
    }
  }

  const previousRole = targetUser.role;

  if (previousRole !== newRole) {
    targetUser.role = newRole;
    await targetUser.save();

    const audit = await AuditLog.create({
      admin: new mongoose.Types.ObjectId(adminId),
      targetUser: targetUser._id,
      actionType: "ROLE_CHANGE",
      previousValue: previousRole,
      newValue: newRole,
      reason: reason.trim(),
    });

    const bookingCount = await Booking.countDocuments({ user: targetUser._id });

    return {
      user: {
        _id: targetUser._id.toString(),
        name: targetUser.name,
        email: targetUser.email,
        phoneNumber: targetUser.phoneNumber || null,
        role: targetUser.role,
        isActive: Boolean(targetUser.isActive),
        bookingCount,
        createdAt: targetUser.createdAt.toISOString(),
        updatedAt: targetUser.updatedAt.toISOString(),
      },
      audit,
    };
  }

  const bookingCount = await Booking.countDocuments({ user: targetUser._id });
  return {
    user: {
      _id: targetUser._id.toString(),
      name: targetUser.name,
      email: targetUser.email,
      phoneNumber: targetUser.phoneNumber || null,
      role: targetUser.role,
      isActive: Boolean(targetUser.isActive),
      bookingCount,
      createdAt: targetUser.createdAt.toISOString(),
      updatedAt: targetUser.updatedAt.toISOString(),
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    audit: null as any,
  };
}

/**
 * Updates a user's account activation status with last-active-admin protection and audit logging.
 */
export async function updateUserStatus({
  adminId,
  targetUserId,
  isActive,
  reason = "",
}: {
  adminId: string;
  targetUserId: string;
  isActive: boolean;
  reason?: string;
}): Promise<{ user: SafeUserSummary; audit: IAuditLog }> {
  await connectToDatabase();

  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    throw new Error("INVALID_USER_ID");
  }

  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    throw new Error("USER_NOT_FOUND");
  }

  // Prevent deactivating the last active administrator
  if (targetUser.role === "ADMIN" && targetUser.isActive && isActive === false) {
    const otherActiveAdmin = await User.findOne({
      role: "ADMIN",
      isActive: true,
      _id: { $ne: targetUser._id },
    });

    if (!otherActiveAdmin) {
      throw new Error("CANNOT_DEACTIVATE_LAST_ADMIN");
    }
  }

  const previousStatus = targetUser.isActive;

  if (previousStatus !== isActive) {
    targetUser.isActive = isActive;
    await targetUser.save();

    const audit = await AuditLog.create({
      admin: new mongoose.Types.ObjectId(adminId),
      targetUser: targetUser._id,
      actionType: "STATUS_CHANGE",
      previousValue: previousStatus ? "ACTIVE" : "INACTIVE",
      newValue: isActive ? "ACTIVE" : "INACTIVE",
      reason: reason.trim(),
    });

    const bookingCount = await Booking.countDocuments({ user: targetUser._id });

    return {
      user: {
        _id: targetUser._id.toString(),
        name: targetUser.name,
        email: targetUser.email,
        phoneNumber: targetUser.phoneNumber || null,
        role: targetUser.role,
        isActive: Boolean(targetUser.isActive),
        bookingCount,
        createdAt: targetUser.createdAt.toISOString(),
        updatedAt: targetUser.updatedAt.toISOString(),
      },
      audit,
    };
  }

  const bookingCount = await Booking.countDocuments({ user: targetUser._id });
  return {
    user: {
      _id: targetUser._id.toString(),
      name: targetUser.name,
      email: targetUser.email,
      phoneNumber: targetUser.phoneNumber || null,
      role: targetUser.role,
      isActive: Boolean(targetUser.isActive),
      bookingCount,
      createdAt: targetUser.createdAt.toISOString(),
      updatedAt: targetUser.updatedAt.toISOString(),
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    audit: null as any,
  };
}
