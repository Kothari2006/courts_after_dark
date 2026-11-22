import connectToDatabase from "@/lib/mongodb";
import Activity, {
  IActivity,
  ActivityStatus,
  ActivityAttendanceStatus,
} from "@/models/Activity";
import Facility, { IFacility } from "@/models/Facility";
import Booking from "@/models/Booking";
import Maintenance from "@/models/Maintenance";
import DemoActivity from "@/models/DemoActivity";
import DemoBooking from "@/models/DemoBooking";
import { DEMO_FACILITIES } from "@/lib/data/demo-facilities";
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

export async function createDemoActivity(
  input: CreateActivityInput,
  teacherId: string
) {
  await connectToDatabase();

  const facility = DEMO_FACILITIES.find(
    (item) => item.id === input.facilityId && item.status === "ACTIVE"
  );
  if (!facility) {
    throw new ActivityNotFoundError("Facility not found");
  }

  const startAt = new Date(input.startAt);
  const endAt = new Date(input.endAt);
  if (endAt <= startAt) {
    throw new ActivityConflictError("End time must be strictly after start time");
  }

  const startHour = startAt.getUTCHours() + startAt.getUTCMinutes() / 60;
  const endHour = endAt.getUTCHours() + endAt.getUTCMinutes() / 60;
  const [openHour, openMinute] = facility.operatingHours.open.split(":").map(Number);
  const [closeHour, closeMinute] = facility.operatingHours.close.split(":").map(Number);
  if (
    startHour < openHour + openMinute / 60 ||
    endHour > closeHour + closeMinute / 60
  ) {
    throw new ActivityConflictError(
      `Activity time must fall within facility operating hours (${facility.operatingHours.open} - ${facility.operatingHours.close})`
    );
  }

  const [bookingConflict, activityConflict] = await Promise.all([
    DemoBooking.findOne({
      facilityId: facility.id,
      status: "CONFIRMED",
      startAt: { $lt: endAt },
      endAt: { $gt: startAt },
    }),
    DemoActivity.findOne({
      facilityId: facility.id,
      status: { $in: ["SCHEDULED", "IN_PROGRESS"] },
      startAt: { $lt: endAt },
      endAt: { $gt: startAt },
    }),
  ]);
  if (bookingConflict) {
    throw new ActivityConflictError(
      `Facility "${facility.name}" already has a reserved booking during this time slot`
    );
  }
  if (activityConflict) {
    throw new ActivityConflictError(
      `Another sports activity ("${activityConflict.title}") is already scheduled at this facility during this time`
    );
  }

  return DemoActivity.create({
    title: input.title.trim(),
    description: input.description?.trim() || "",
    sportType: input.sportType,
    facilityId: facility.id,
    createdBy: new Types.ObjectId(teacherId),
    startAt,
    endAt,
    participantLimit: input.participantLimit || 20,
    participants: [],
    status: "SCHEDULED",
  });
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

  const demoFacilityId = params.facilityId?.startsWith("fac-")
    ? params.facilityId
    : undefined;
  if (params.facilityId && !demoFacilityId) {
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

  const demoFilter: Record<string, unknown> = {};
  if (params.search) demoFilter.title = { $regex: params.search.trim(), $options: "i" };
  if (demoFacilityId) demoFilter.facilityId = demoFacilityId;
  if (params.sportType && params.sportType !== "ALL") demoFilter.sportType = params.sportType;
  if (params.status && params.status !== "ALL") demoFilter.status = params.status;
  if (params.mine && params.teacherId) demoFilter.createdBy = new Types.ObjectId(params.teacherId);
  if (params.from || params.to) {
    demoFilter.startAt = {
      ...(params.from ? { $gte: new Date(params.from) } : {}),
      ...(params.to ? { $lte: new Date(params.to) } : {}),
    };
  }

  const [activities, total, demoActivities, demoTotal] = await Promise.all([
    Activity.find(filter)
      .populate("facility", "name sportType location")
      .populate("createdBy", "name email role")
      .sort({ startAt: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Activity.countDocuments(filter),
    DemoActivity.find(demoFilter)
      .populate("createdBy", "name email role")
      .populate("participants.user", "name email role")
      .sort({ startAt: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    DemoActivity.countDocuments(demoFilter),
  ]);

  const mappedDemoActivities = demoActivities.map((activity) => {
    const facility = DEMO_FACILITIES.find((item) => item.id === activity.facilityId);
    return {
      ...activity,
      facility: facility
        ? {
            _id: facility.id,
            name: facility.name,
            sportType: facility.sportType,
            location: facility.location,
          }
        : null,
    };
  });

  return {
    activities: [...activities, ...mappedDemoActivities].sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
    ),
    pagination: {
      page,
      limit,
      total: total + demoTotal,
      totalPages: Math.ceil((total + demoTotal) / limit) || 1,
    },
  };
}

export async function getActivityById(id: string) {
  await connectToDatabase();

  const activity = await Activity.findById(id)
    .populate("facility", "name sportType location operatingHours")
    .populate("createdBy", "name email role")
    .populate("participants.user", "name email role");

  if (activity) return activity;

  const demoActivity = await DemoActivity.findById(id)
    .populate("createdBy", "name email role")
    .populate("participants.user", "name email role");
  if (!demoActivity) throw new ActivityNotFoundError();

  const facility = DEMO_FACILITIES.find((item) => item.id === demoActivity.facilityId);
  return {
    ...demoActivity.toObject(),
    facility: facility
      ? {
          _id: facility.id,
          name: facility.name,
          sportType: facility.sportType,
          location: facility.location,
          operatingHours: facility.operatingHours,
        }
      : null,
  };
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
    const demoActivity = await DemoActivity.findById(id);
    if (!demoActivity) throw new ActivityNotFoundError();
    if (!isAdmin && demoActivity.createdBy.toString() !== teacherId) {
      throw new ActivityForbiddenError("You can only edit activities that you created");
    }
    if (updates.facilityId || updates.startAt || updates.endAt) {
      throw new ActivityConflictError("Demo activity schedule cannot be changed");
    }
    if (updates.title) demoActivity.title = updates.title.trim();
    if (updates.description !== undefined) demoActivity.description = updates.description.trim();
    if (updates.sportType) demoActivity.sportType = updates.sportType;
    if (updates.participantLimit) demoActivity.participantLimit = updates.participantLimit;
    if (updates.status) demoActivity.status = updates.status;
    await demoActivity.save();
    return demoActivity;
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
    const demoActivity = await DemoActivity.findById(id);
    if (!demoActivity) throw new ActivityNotFoundError();
    if (!isAdmin && demoActivity.createdBy.toString() !== teacherId) {
      throw new ActivityForbiddenError("You can only cancel activities that you created");
    }
    demoActivity.status = "CANCELLED";
    demoActivity.cancellationReason = reason || "Cancelled by organizer";
    demoActivity.cancelledAt = new Date();
    demoActivity.cancelledBy = new Types.ObjectId(teacherId);
    await demoActivity.save();
    return demoActivity;
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
    const demoActivity = await DemoActivity.findById(activityId);
    if (!demoActivity) throw new ActivityNotFoundError();
    if (demoActivity.status !== "SCHEDULED") {
      throw new ActivityConflictError(
        `Cannot join an activity that is ${demoActivity.status.toLowerCase()}`
      );
    }
    if (new Date() >= demoActivity.endAt) {
      throw new ActivityConflictError("This activity has already ended");
    }
    if (demoActivity.participants.some((participant) => participant.user.toString() === userId)) {
      throw new ActivityConflictError("You are already registered for this activity");
    }
    if (demoActivity.participants.length >= demoActivity.participantLimit) {
      throw new ActivityConflictError("This activity has reached its participant limit");
    }
    demoActivity.participants.push({
      user: new Types.ObjectId(userId),
      joinedAt: new Date(),
      attendanceStatus: "REGISTERED",
    });
    await demoActivity.save();
    return demoActivity;
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
    const demoActivity = await DemoActivity.findById(activityId);
    if (!demoActivity) throw new ActivityNotFoundError();
    const participantIndex = demoActivity.participants.findIndex(
      (participant) => participant.user.toString() === userId
    );
    if (participantIndex === -1) {
      throw new ActivityNotFoundError("You are not registered for this activity");
    }
    demoActivity.participants.splice(participantIndex, 1);
    await demoActivity.save();
    return demoActivity;
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
