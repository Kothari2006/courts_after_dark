import mongoose from "mongoose";
import { notifyMaintenanceScheduled } from "./notification.service";
import connectToDatabase from "@/lib/mongodb";
import Maintenance, {
  IMaintenance,
  MaintenanceStatus,
} from "@/models/Maintenance";
import Facility, { IFacility } from "@/models/Facility";
import Booking from "@/models/Booking";
import {
  BLOCKING_BOOKING_STATUSES,
  BLOCKING_MAINTENANCE_STATUSES,
} from "./availability.service";
import { withFacilityLock } from "./booking.service";

export interface ConflictingBookingSummary {
  _id: string;
  startAt: string;
  endAt: string;
  startTime: string;
  endTime: string;
  bookingType: string;
  user: {
    _id: string;
    name?: string;
    email: string;
  };
}

export class BookingConflictError extends Error {
  public conflictingBookings: ConflictingBookingSummary[];

  constructor(message: string, conflictingBookings: ConflictingBookingSummary[]) {
    super(message);
    this.name = "BookingConflictError";
    this.conflictingBookings = conflictingBookings;
  }
}

export interface CreateMaintenanceParams {
  facilityId: string;
  startAt: string | Date;
  endAt: string | Date;
  reason: string;
  notes?: string;
  status?: "SCHEDULED" | "IN_PROGRESS";
  adminId: string;
}

export interface UpdateMaintenanceParams {
  facilityId?: string;
  startAt?: string | Date;
  endAt?: string | Date;
  reason?: string;
  notes?: string;
  status?: MaintenanceStatus;
}

export interface GetMaintenanceListParams {
  facilityId?: string;
  status?: MaintenanceStatus | "ALL";
  from?: string | Date;
  to?: string | Date;
  page?: number;
  limit?: number;
}

/**
 * Creates a maintenance schedule for a sports facility.
 * Enforces facility locking, checks for maintenance overlaps, and detects booking conflicts.
 * Never silently cancels conflicting bookings.
 */
export async function createMaintenance(
  params: CreateMaintenanceParams
): Promise<IMaintenance> {
  const maintenance = await createMaintenanceInternal(params);
  await notifyMaintenanceScheduled(maintenance);
  return maintenance;
}

async function createMaintenanceInternal({
  facilityId,
  startAt,
  endAt,
  reason,
  notes,
  status = "SCHEDULED",
  adminId,
}: CreateMaintenanceParams): Promise<IMaintenance> {
  if (!mongoose.Types.ObjectId.isValid(facilityId)) {
    throw new Error("INVALID_FACILITY_ID");
  }
  if (!mongoose.Types.ObjectId.isValid(adminId)) {
    throw new Error("INVALID_ADMIN_ID");
  }

  const startDate = new Date(startAt);
  const endDate = new Date(endAt);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new Error("INVALID_DATE_FORMAT");
  }

  if (endDate <= startDate) {
    throw new Error("INVALID_TIME_RANGE");
  }

  return withFacilityLock(facilityId, async () => {
    await connectToDatabase();

    const facility = await Facility.findById(facilityId).lean<IFacility>();
    if (!facility) {
      throw new Error("FACILITY_NOT_FOUND");
    }

    // 1. Check for overlapping active maintenance on the same facility
    // Overlap condition: startAt < newEnd && endAt > newStart
    const overlappingMaintenance = await Maintenance.findOne({
      facility: facility._id,
      status: { $in: BLOCKING_MAINTENANCE_STATUSES },
      startAt: { $lt: endDate },
      endAt: { $gt: startDate },
    }).lean<IMaintenance>();

    if (overlappingMaintenance) {
      throw new Error("MAINTENANCE_OVERLAP");
    }

    // 2. Check for overlapping confirmed or pending bookings
    const overlappingBookings = await Booking.find({
      facility: facility._id,
      status: { $in: BLOCKING_BOOKING_STATUSES },
      startAt: { $lt: endDate },
      endAt: { $gt: startDate },
    })
      .populate("user", "name email")
      .lean();

    if (overlappingBookings.length > 0) {
      // Map conflicting bookings to safe summary format
      const conflictSummaries: ConflictingBookingSummary[] = overlappingBookings.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (b: any) => ({
          _id: b._id.toString(),
          startAt: b.startAt.toISOString(),
          endAt: b.endAt.toISOString(),
          startTime: b.startTime,
          endTime: b.endTime,
          bookingType: b.bookingType,
          user: {
            _id: b.user?._id?.toString() || b.user?.toString() || "",
            name: b.user?.name,
            email: b.user?.email || "Unknown",
          },
        })
      );

      throw new BookingConflictError("BOOKING_CONFLICT", conflictSummaries);
    }

    // 3. Save maintenance record
    const maintenance = await Maintenance.create({
      facility: facility._id,
      startAt: startDate,
      endAt: endDate,
      reason: reason.trim(),
      notes: notes?.trim() || undefined,
      status,
      createdBy: new mongoose.Types.ObjectId(adminId),
    });

    return maintenance;
  });
}

/**
 * Retrieves paginated maintenance schedules with optional filters.
 */
export async function getMaintenanceSchedules({
  facilityId,
  status,
  from,
  to,
  page = 1,
  limit = 20,
}: GetMaintenanceListParams) {
  await connectToDatabase();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: any = {};

  if (facilityId && facilityId !== "ALL") {
    if (mongoose.Types.ObjectId.isValid(facilityId)) {
      filter.facility = new mongoose.Types.ObjectId(facilityId);
    }
  }

  if (status && status !== "ALL") {
    filter.status = status;
  }

  if (from || to) {
    if (from && to) {
      filter.startAt = { $lte: new Date(to) };
      filter.endAt = { $gte: new Date(from) };
    } else if (from) {
      filter.endAt = { $gte: new Date(from) };
    } else if (to) {
      filter.startAt = { $lte: new Date(to) };
    }
  }

  const skip = (Math.max(1, page) - 1) * limit;

  const [items, total] = await Promise.all([
    Maintenance.find(filter)
      .populate("facility", "name sportType location")
      .populate("createdBy", "name email")
      .populate("cancelledBy", "name email")
      .populate("completedBy", "name email")
      .sort({ startAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Maintenance.countDocuments(filter),
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
 * Retrieves details of a single maintenance schedule by ID.
 */
export async function getMaintenanceById(id: string): Promise<IMaintenance> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("INVALID_MAINTENANCE_ID");
  }

  await connectToDatabase();

  const maintenance = await Maintenance.findById(id)
    .populate("facility", "name sportType location operatingHours slotDuration")
    .populate("createdBy", "name email")
    .populate("cancelledBy", "name email")
    .populate("completedBy", "name email")
    .lean<IMaintenance>();

  if (!maintenance) {
    throw new Error("MAINTENANCE_NOT_FOUND");
  }

  return maintenance;
}

/**
 * Updates an existing maintenance schedule safely.
 * Prevents modification of cancelled or completed maintenance.
 * Rechecks maintenance and booking conflicts if times change.
 */
export async function updateMaintenance(
  id: string,
  params: UpdateMaintenanceParams,
  adminId: string
): Promise<IMaintenance> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("INVALID_MAINTENANCE_ID");
  }
  if (!mongoose.Types.ObjectId.isValid(adminId)) {
    throw new Error("INVALID_ADMIN_ID");
  }

  await connectToDatabase();

  const maintenance = await Maintenance.findById(id);
  if (!maintenance) {
    throw new Error("MAINTENANCE_NOT_FOUND");
  }

  if (maintenance.status === "CANCELLED" || maintenance.status === "COMPLETED") {
    throw new Error("CANNOT_MODIFY_TERMINAL_MAINTENANCE");
  }

  const targetFacilityId = params.facilityId || maintenance.facility.toString();

  return withFacilityLock(targetFacilityId, async () => {
    const startDate = params.startAt ? new Date(params.startAt) : maintenance.startAt;
    const endDate = params.endAt ? new Date(params.endAt) : maintenance.endAt;

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error("INVALID_DATE_FORMAT");
    }

    if (endDate <= startDate) {
      throw new Error("INVALID_TIME_RANGE");
    }

    const timeOrFacilityChanged =
      params.startAt !== undefined ||
      params.endAt !== undefined ||
      params.facilityId !== undefined;

    if (timeOrFacilityChanged) {
      // Recheck active maintenance overlap
      const overlappingMaintenance = await Maintenance.findOne({
        _id: { $ne: maintenance._id },
        facility: new mongoose.Types.ObjectId(targetFacilityId),
        status: { $in: BLOCKING_MAINTENANCE_STATUSES },
        startAt: { $lt: endDate },
        endAt: { $gt: startDate },
      }).lean<IMaintenance>();

      if (overlappingMaintenance) {
        throw new Error("MAINTENANCE_OVERLAP");
      }

      // Recheck booking conflicts
      const overlappingBookings = await Booking.find({
        facility: new mongoose.Types.ObjectId(targetFacilityId),
        status: { $in: BLOCKING_BOOKING_STATUSES },
        startAt: { $lt: endDate },
        endAt: { $gt: startDate },
      })
        .populate("user", "name email")
        .lean();

      if (overlappingBookings.length > 0) {
        const conflictSummaries: ConflictingBookingSummary[] = overlappingBookings.map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (b: any) => ({
            _id: b._id.toString(),
            startAt: b.startAt.toISOString(),
            endAt: b.endAt.toISOString(),
            startTime: b.startTime,
            endTime: b.endTime,
            bookingType: b.bookingType,
            user: {
              _id: b.user?._id?.toString() || b.user?.toString() || "",
              name: b.user?.name,
              email: b.user?.email || "Unknown",
            },
          })
        );

        throw new BookingConflictError("BOOKING_CONFLICT", conflictSummaries);
      }
    }

    // Apply updates
    if (params.facilityId) {
      maintenance.facility = new mongoose.Types.ObjectId(params.facilityId);
    }
    maintenance.startAt = startDate;
    maintenance.endAt = endDate;
    if (params.reason) maintenance.reason = params.reason.trim();
    if (params.notes !== undefined) maintenance.notes = params.notes.trim();

    if (params.status) {
      // Validate transition
      if (params.status === "CANCELLED") {
        maintenance.status = "CANCELLED";
        maintenance.cancelledBy = new mongoose.Types.ObjectId(adminId);
        maintenance.cancelledAt = new Date();
      } else if (params.status === "COMPLETED") {
        maintenance.status = "COMPLETED";
        maintenance.completedBy = new mongoose.Types.ObjectId(adminId);
        maintenance.completedAt = new Date();
      } else {
        maintenance.status = params.status;
      }
    }

    await maintenance.save();
    return maintenance;
  });
}

/**
 * Cancels a scheduled or in-progress maintenance activity.
 * Records the cancelling administrator, cancellation timestamp, and reason.
 * Does NOT permanently delete the record.
 */
export async function cancelMaintenance(
  id: string,
  adminId: string,
  reason?: string
): Promise<IMaintenance> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("INVALID_MAINTENANCE_ID");
  }
  if (!mongoose.Types.ObjectId.isValid(adminId)) {
    throw new Error("INVALID_ADMIN_ID");
  }

  await connectToDatabase();

  const maintenance = await Maintenance.findById(id);
  if (!maintenance) {
    throw new Error("MAINTENANCE_NOT_FOUND");
  }

  if (maintenance.status === "CANCELLED") {
    throw new Error("ALREADY_CANCELLED");
  }

  if (maintenance.status === "COMPLETED") {
    throw new Error("CANNOT_CANCEL_COMPLETED");
  }

  maintenance.status = "CANCELLED";
  maintenance.cancelledBy = new mongoose.Types.ObjectId(adminId);
  maintenance.cancelledAt = new Date();
  if (reason) {
    maintenance.cancellationReason = reason.trim();
  }

  await maintenance.save();
  return maintenance;
}

/**
 * Marks maintenance as completed.
 * Records completing administrator and completion timestamp.
 */
export async function completeMaintenance(
  id: string,
  adminId: string,
  notes?: string
): Promise<IMaintenance> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("INVALID_MAINTENANCE_ID");
  }
  if (!mongoose.Types.ObjectId.isValid(adminId)) {
    throw new Error("INVALID_ADMIN_ID");
  }

  await connectToDatabase();

  const maintenance = await Maintenance.findById(id);
  if (!maintenance) {
    throw new Error("MAINTENANCE_NOT_FOUND");
  }

  if (maintenance.status === "COMPLETED") {
    throw new Error("ALREADY_COMPLETED");
  }

  if (maintenance.status === "CANCELLED") {
    throw new Error("CANNOT_COMPLETE_CANCELLED");
  }

  maintenance.status = "COMPLETED";
  maintenance.completedBy = new mongoose.Types.ObjectId(adminId);
  maintenance.completedAt = new Date();
  if (notes) {
    maintenance.notes = notes.trim();
  }

  await maintenance.save();
  return maintenance;
}

/**
 * Checks for maintenance or booking conflicts for a proposed time window.
 */
export async function checkMaintenanceConflicts(
  facilityId: string,
  startAt: string | Date,
  endAt: string | Date,
  excludeMaintenanceId?: string
) {
  if (!mongoose.Types.ObjectId.isValid(facilityId)) {
    throw new Error("INVALID_FACILITY_ID");
  }

  const startDate = new Date(startAt);
  const endDate = new Date(endAt);

  if (endDate <= startDate) {
    throw new Error("INVALID_TIME_RANGE");
  }

  await connectToDatabase();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const maintenanceQuery: any = {
    facility: new mongoose.Types.ObjectId(facilityId),
    status: { $in: BLOCKING_MAINTENANCE_STATUSES },
    startAt: { $lt: endDate },
    endAt: { $gt: startDate },
  };

  if (excludeMaintenanceId && mongoose.Types.ObjectId.isValid(excludeMaintenanceId)) {
    maintenanceQuery._id = { $ne: new mongoose.Types.ObjectId(excludeMaintenanceId) };
  }

  const [overlappingMaintenance, overlappingBookings] = await Promise.all([
    Maintenance.find(maintenanceQuery).select("startAt endAt reason status").lean(),
    Booking.find({
      facility: new mongoose.Types.ObjectId(facilityId),
      status: { $in: BLOCKING_BOOKING_STATUSES },
      startAt: { $lt: endDate },
      endAt: { $gt: startDate },
    })
      .populate("user", "name email")
      .select("startAt endAt startTime endTime bookingType user status")
      .lean(),
  ]);

  const hasConflict =
    overlappingMaintenance.length > 0 || overlappingBookings.length > 0;

  return {
    hasConflict,
    conflictingMaintenance: overlappingMaintenance,
    conflictingBookings: overlappingBookings,
  };
}

/**
 * Retrieves aggregate maintenance statistics for the admin dashboard.
 */
export async function getMaintenanceStats() {
  await connectToDatabase();

  const [totalCount, scheduledCount, inProgressCount, completedCount, cancelledCount] =
    await Promise.all([
      Maintenance.countDocuments(),
      Maintenance.countDocuments({ status: "SCHEDULED" }),
      Maintenance.countDocuments({ status: "IN_PROGRESS" }),
      Maintenance.countDocuments({ status: "COMPLETED" }),
      Maintenance.countDocuments({ status: "CANCELLED" }),
    ]);

  const activeFacilityIds = await Maintenance.distinct("facility", {
    status: { $in: BLOCKING_MAINTENANCE_STATUSES },
  });

  return {
    totalSchedules: totalCount,
    scheduledCount,
    inProgressCount,
    completedCount,
    cancelledCount,
    facilitiesUnderMaintenanceCount: activeFacilityIds.length,
  };
}
