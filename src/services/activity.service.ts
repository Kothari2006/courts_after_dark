import connectToDatabase from "@/lib/mongodb";
import Activity, {
  IActivity,
  ActivityStatus,
  ActivityAttendanceStatus,
} from "@/models/Activity";
import Facility, { IFacility } from "@/models/Facility";
import Booking from "@/models/Booking";
import Maintenance from "@/models/Maintenance";
import { Types } from "mongoose";

export class ActivityConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ActivityConflictError";
  }
}

export class ActivityForbiddenError extends Error {
  constructor(message: string = "Forbidden: You are not authorized to manage this activity") {
    super(message);
    this.name = "ActivityForbiddenError";
  }
}

export class ActivityNotFoundError extends Error {
  constructor(message: string = "Activity not found") {
    super(message);
    this.name = "ActivityNotFoundError";
  }
}

/**
 * Validates that a facility is active, within operating hours,
 * and free of maintenance periods, confirmed bookings, and overlapping activities.
 */
export async function validateFacilityAvailabilityForActivity(
  facilityId: string | Types.ObjectId,
  startAt: Date,
  endAt: Date,
  excludeActivityId?: string | Types.ObjectId
): Promise<IFacility> {
  await connectToDatabase();

  const facility = await Facility.findById(facilityId);
  if (!facility) {
    throw new ActivityNotFoundError("Facility not found");
  }

  if (facility.status !== "ACTIVE") {
    throw new ActivityConflictError(
      `Facility "${facility.name}" is currently ${facility.status.toLowerCase()} and cannot host activities`
    );
  }

  // Operating hours check
  if (facility.operatingHours?.open && facility.operatingHours?.close) {
    const startHour = startAt.getUTCHours() + startAt.getUTCMinutes() / 60;
    const endHour = endAt.getUTCHours() + endAt.getUTCMinutes() / 60;

    const [openH, openM] = facility.operatingHours.open.split(":").map(Number);
    const [closeH, closeM] = facility.operatingHours.close.split(":").map(Number);
    const facilityOpen = openH + (openM || 0) / 60;
    const facilityClose = closeH + (closeM || 0) / 60;

    // Check bounds (assuming standard same-day operating window)
    if (facilityClose > facilityOpen) {
      if (startHour < facilityOpen || endHour > facilityClose) {
        throw new ActivityConflictError(
          `Activity time must fall within facility operating hours (${facility.operatingHours.open} - ${facility.operatingHours.close})`
        );
      }
    }
  }

  // 1. Maintenance conflict check
  const maintenanceConflict = await Maintenance.findOne({
    facility: facilityId,
    status: { $in: ["SCHEDULED", "IN_PROGRESS"] },
    startAt: { $lt: endAt },
    endAt: { $gt: startAt },
  });

  if (maintenanceConflict) {
    throw new ActivityConflictError(
      `Facility "${facility.name}" has scheduled maintenance during the requested time (${maintenanceConflict.reason})`
    );
  }

  // 2. Booking conflict check
  const bookingConflict = await Booking.findOne({
    facility: facilityId,
    status: { $in: ["CONFIRMED", "PENDING"] },
    startAt: { $lt: endAt },
    endAt: { $gt: startAt },
  });

  if (bookingConflict) {
    throw new ActivityConflictError(
      `Facility "${facility.name}" already has a reserved booking during this time slot`
    );
  }

  // 3. Overlapping activity conflict check
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activityQuery: any = {
    facility: facilityId,
    status: { $in: ["SCHEDULED", "IN_PROGRESS"] },
    startAt: { $lt: endAt },
    endAt: { $gt: startAt },
  };

  if (excludeActivityId) {
    activityQuery._id = { $ne: new Types.ObjectId(excludeActivityId.toString()) };
  }

  const existingActivity = await Activity.findOne(activityQuery);
  if (existingActivity) {
    throw new ActivityConflictError(
      `Another sports activity ("${existingActivity.title}") is already scheduled at this facility during this time`
    );
  }

  return facility;
}

export interface CreateActivityInput {
  title: string;
  description?: string;
  sportType: string;
  facilityId: string;
  startAt: string;
  endAt: string;
  participantLimit?: number;
}

export async function createActivity(
  input: CreateActivityInput,
  teacherId: string
): Promise<IActivity> {
  await connectToDatabase();

  const startAt = new Date(input.startAt);
  const endAt = new Date(input.endAt);

  if (endAt <= startAt) {
    throw new ActivityConflictError("End time must be strictly after start time");
  }

  await validateFacilityAvailabilityForActivity(input.facilityId, startAt, endAt);

  const activity = await Activity.create({
    title: input.title.trim(),
    description: input.description?.trim() || "",
    sportType: input.sportType as any,
    facility: new Types.ObjectId(input.facilityId),
    createdBy: new Types.ObjectId(teacherId),
    startAt,
    endAt,
    participantLimit: input.participantLimit || 20,
    participants: [],
    status: "SCHEDULED",
  });

  return activity;
}

export interface ActivityFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  facilityId?: string;
  sportType?: string;
  status?: string;
  from?: string;
  to?: string;
  mine?: boolean;
  teacherId?: string;
}

export async function getActivities(params: ActivityFilterParams = {}) {
  await connectToDatabase();

  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));
  const skip = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: any = {};

  if (params.search) {
    filter.title = { $regex: params.search.trim(), $options: "i" };
  }

  if (params.facilityId) {
    filter.facility = new Types.ObjectId(params.facilityId);
  }

  if (params.sportType && params.sportType !== "ALL") {
    filter.sportType = params.sportType;
  }

  if (params.status && params.status !== "ALL") {
    filter.status = params.status;
  }

  if (params.mine && params.teacherId) {
    filter.createdBy = new Types.ObjectId(params.teacherId);
  }

  if (params.from || params.to) {
    filter.startAt = {};
    if (params.from) filter.startAt.$gte = new Date(params.from);
    if (params.to) filter.startAt.$lte = new Date(params.to);
  }

  const [activities, total] = await Promise.all([
    Activity.find(filter)
      .populate("facility", "name sportType location")
      .populate("createdBy", "name email role")
      .sort({ startAt: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Activity.countDocuments(filter),
  ]);

  return {
    activities,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function getActivityById(id: string) {
  await connectToDatabase();

  const activity = await Activity.findById(id)
    .populate("facility", "name sportType location operatingHours")
    .populate("createdBy", "name email role")
    .populate("participants.user", "name email role");

  if (!activity) {
    throw new ActivityNotFoundError();
  }

  return activity;
}

export interface UpdateActivityInput {
  title?: string;
  description?: string;
  sportType?: string;
  facilityId?: string;
  startAt?: string;
  endAt?: string;
  participantLimit?: number;
  status?: ActivityStatus;
}

export async function updateActivity(
  id: string,
  updates: UpdateActivityInput,
  teacherId: string,
  isAdmin = false
) {
  await connectToDatabase();

  const activity = await Activity.findById(id);
  if (!activity) {
    throw new ActivityNotFoundError();
  }

  // Authorization: Only the creator teacher or an ADMIN can edit
  if (!isAdmin && activity.createdBy.toString() !== teacherId) {
    throw new ActivityForbiddenError("You can only edit activities that you created");
  }

  const targetFacilityId = updates.facilityId
    ? updates.facilityId
    : activity.facility.toString();

  const targetStartAt = updates.startAt ? new Date(updates.startAt) : activity.startAt;
  const targetEndAt = updates.endAt ? new Date(updates.endAt) : activity.endAt;

  // If time or facility is being changed, re-check conflicts
  const isTimeOrFacilityChanged =
    updates.facilityId || updates.startAt || updates.endAt;

  if (isTimeOrFacilityChanged) {
    if (targetEndAt <= targetStartAt) {
      throw new ActivityConflictError("End time must be strictly after start time");
    }

    await validateFacilityAvailabilityForActivity(
      targetFacilityId,
      targetStartAt,
      targetEndAt,
      activity._id
    );

    activity.facility = new Types.ObjectId(targetFacilityId);
    activity.startAt = targetStartAt;
    activity.endAt = targetEndAt;
  }

  if (updates.title) activity.title = updates.title.trim();
  if (updates.description !== undefined) activity.description = updates.description.trim();
  if (updates.sportType) activity.sportType = updates.sportType as any;
  if (updates.participantLimit) activity.participantLimit = updates.participantLimit;
  if (updates.status) activity.status = updates.status;

  await activity.save();
  return activity;
}

export async function cancelActivity(
  id: string,
  reason: string | undefined,
  teacherId: string,
  isAdmin = false
) {
  await connectToDatabase();

  const activity = await Activity.findById(id);
  if (!activity) {
    throw new ActivityNotFoundError();
  }

  if (!isAdmin && activity.createdBy.toString() !== teacherId) {
    throw new ActivityForbiddenError("You can only cancel activities that you created");
  }

  activity.status = "CANCELLED";
  activity.cancellationReason = reason || "Cancelled by organizer";
  activity.cancelledAt = new Date();
  activity.cancelledBy = new Types.ObjectId(teacherId);

  await activity.save();
  return activity;
}

export async function joinActivity(activityId: string, userId: string) {
  await connectToDatabase();

  const activity = await Activity.findById(activityId);
  if (!activity) {
    throw new ActivityNotFoundError();
  }

  if (activity.status !== "SCHEDULED") {
    throw new ActivityConflictError(
      `Cannot join an activity that is ${activity.status.toLowerCase()}`
    );
  }

  if (new Date() >= activity.endAt) {
    throw new ActivityConflictError("This activity has already ended");
  }

  const isAlreadyRegistered = activity.participants.some(
    (p) => p.user.toString() === userId
  );

  if (isAlreadyRegistered) {
    throw new ActivityConflictError("You are already registered for this activity");
  }

  if (activity.participants.length >= activity.participantLimit) {
    throw new ActivityConflictError("This activity has reached its participant limit");
  }

  activity.participants.push({
    user: new Types.ObjectId(userId),
    joinedAt: new Date(),
    attendanceStatus: "REGISTERED",
  } as any);

  await activity.save();
  return activity;
}

export async function leaveActivity(activityId: string, userId: string) {
  await connectToDatabase();

  const activity = await Activity.findById(activityId);
  if (!activity) {
    throw new ActivityNotFoundError();
  }

  const participantIndex = activity.participants.findIndex(
    (p) => p.user.toString() === userId
  );

  if (participantIndex === -1) {
    throw new ActivityNotFoundError("You are not registered for this activity");
  }

  activity.participants.splice(participantIndex, 1);
  await activity.save();
  return activity;
}

export async function markActivityAttendance(
  activityId: string,
  records: Array<{ participantId: string; status: ActivityAttendanceStatus }>,
  teacherId: string,
  isAdmin = false
) {
  await connectToDatabase();

  const activity = await Activity.findById(activityId);
  if (!activity) {
    throw new ActivityNotFoundError();
  }

  // Teacher ownership check
  if (!isAdmin && activity.createdBy.toString() !== teacherId) {
    throw new ActivityForbiddenError(
      "Attendance management is restricted to the teacher who organized this activity"
    );
  }

  const teacherObjId = new Types.ObjectId(teacherId);
  const now = new Date();

  records.forEach((rec) => {
    const participant = activity.participants.find(
      (p) => p._id.toString() === rec.participantId
    );
    if (participant) {
      participant.attendanceStatus = rec.status;
      participant.markedAt = now;
      participant.markedBy = teacherObjId;
    }
  });

  await activity.save();
  return activity;
}
