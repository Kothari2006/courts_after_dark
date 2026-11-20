import connectToDatabase from "@/lib/mongodb";
import Event, { IEvent, EventStatus, ITournamentMatch } from "@/models/Event";
import EventRegistration, { IEventRegistration } from "@/models/EventRegistration";
import Facility, { IFacility } from "@/models/Facility";
import Booking from "@/models/Booking";
import Maintenance from "@/models/Maintenance";
import User from "@/models/User";
import { createNotification } from "./notification.service";
import { Types } from "mongoose";

export class EventConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EventConflictError";
  }
}

export class EventForbiddenError extends Error {
  constructor(message: string = "Forbidden: You are not authorized to manage this event") {
    super(message);
    this.name = "EventForbiddenError";
  }
}

export class EventNotFoundError extends Error {
  constructor(message: string = "Event not found") {
    super(message);
    this.name = "EventNotFoundError";
  }
}

export class EventCapacityError extends Error {
  constructor(message: string = "Event is full or registration is closed") {
    super(message);
    this.name = "EventCapacityError";
  }
}

export class DuplicateRegistrationError extends Error {
  constructor(message: string = "You are already registered for this event") {
    super(message);
    this.name = "DuplicateRegistrationError";
  }
}

/**
 * Validates that facility is active, within operating hours,
 * and free of maintenance periods, confirmed student bookings, and other events.
 */
export async function validateFacilityAvailabilityForEvent(
  facilityId: string | Types.ObjectId,
  startAt: Date,
  endAt: Date,
  excludeEventId?: string | Types.ObjectId
): Promise<IFacility> {
  await connectToDatabase();

  const facility = await Facility.findById(facilityId);
  if (!facility) {
    throw new EventNotFoundError("Facility not found");
  }

  if (facility.status !== "ACTIVE") {
    throw new EventConflictError(
      `Facility "${facility.name}" is currently ${facility.status.toLowerCase()} and cannot host events`
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

    if (facilityClose > facilityOpen) {
      if (startHour < facilityOpen || endHour > facilityClose) {
        throw new EventConflictError(
          `Event time must fall within facility operating hours (${facility.operatingHours.open} - ${facility.operatingHours.close})`
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
    throw new EventConflictError(
      `Facility "${facility.name}" has scheduled maintenance during the requested event window (${maintenanceConflict.reason})`
    );
  }

  // 2. Confirmed or pending booking conflict check
  const bookingConflict = await Booking.findOne({
    facility: facilityId,
    status: { $in: ["CONFIRMED", "PENDING"] },
    startAt: { $lt: endAt },
    endAt: { $gt: startAt },
  });

  if (bookingConflict) {
    throw new EventConflictError(
      `Facility "${facility.name}" already has an active court booking during this time slot`
    );
  }

  // 3. Overlapping event check
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const eventQuery: any = {
    facility: facilityId,
    status: {
      $in: [
        "PUBLISHED",
        "REGISTRATION_OPEN",
        "REGISTRATION_CLOSED",
        "ONGOING",
      ],
    },
    startAt: { $lt: endAt },
    endAt: { $gt: startAt },
  };

  if (excludeEventId) {
    eventQuery._id = { $ne: new Types.ObjectId(excludeEventId.toString()) };
  }

  const existingEvent = await Event.findOne(eventQuery);
  if (existingEvent) {
    throw new EventConflictError(
      `Another sports event ("${existingEvent.title}") is already scheduled at this facility during this time`
    );
  }

  return facility;
}

export interface CreateEventInput {
  title: string;
  description: string;
  sportType: string;
  eventType: string;
  facilityId: string;
  startAt: string;
  endAt: string;
  registrationStartAt: string;
  registrationEndAt: string;
  participantLimit: number;
  participationType?: "INDIVIDUAL" | "TEAM";
  teamSizeLimit?: number;
  rules?: string;
  bannerImage?: string | null;
  isDraft?: boolean;
}

export async function createEvent(
  input: CreateEventInput,
  teacherId: string
): Promise<IEvent> {
  await connectToDatabase();

  const startAt = new Date(input.startAt);
  const endAt = new Date(input.endAt);
  const registrationStartAt = new Date(input.registrationStartAt);
  const registrationEndAt = new Date(input.registrationEndAt);

  if (endAt <= startAt) {
    throw new EventConflictError("End time must be strictly after start time");
  }

  // If not draft, validate facility schedule
  if (!input.isDraft) {
    await validateFacilityAvailabilityForEvent(input.facilityId, startAt, endAt);
  }

  const now = new Date();
  let initialStatus: EventStatus = "DRAFT";

  if (!input.isDraft) {
    if (now >= registrationStartAt && now <= registrationEndAt) {
      initialStatus = "REGISTRATION_OPEN";
    } else {
      initialStatus = "PUBLISHED";
    }
  }

  const event = await Event.create({
    title: input.title.trim(),
    description: input.description.trim(),
    sportType: input.sportType as any,
    eventType: input.eventType as any,
    facility: new Types.ObjectId(input.facilityId),
    organizer: new Types.ObjectId(teacherId),
    startAt,
    endAt,
    registrationStartAt,
    registrationEndAt,
    participantLimit: input.participantLimit,
    registrationCount: 0,
    participationType: input.participationType || "INDIVIDUAL",
    teamSizeLimit: input.participationType === "TEAM" ? input.teamSizeLimit || 5 : 1,
    status: initialStatus,
    rules: input.rules?.trim() || "Standard university athletic tournament regulations apply.",
    bannerImage: input.bannerImage || null,
    tournamentMatches: [],
  });

  return event;
}

export async function publishEvent(
  eventId: string,
  teacherId: string,
  isAdmin = false
): Promise<IEvent> {
  await connectToDatabase();

  const event = await Event.findById(eventId);
  if (!event) {
    throw new EventNotFoundError();
  }

  if (!isAdmin && event.organizer.toString() !== teacherId) {
    throw new EventForbiddenError("You can only publish events that you organize");
  }

  // Validate facility availability
  await validateFacilityAvailabilityForEvent(
    event.facility,
    event.startAt,
    event.endAt,
    event._id
  );

  const now = new Date();
  if (now >= event.registrationStartAt && now <= event.registrationEndAt) {
    event.status = "REGISTRATION_OPEN";
  } else {
    event.status = "PUBLISHED";
  }

  await event.save();
  return event;
}

export async function updateEvent(
  eventId: string,
  updates: Partial<CreateEventInput>,
  teacherId: string,
  isAdmin = false
): Promise<IEvent> {
  await connectToDatabase();

  const event = await Event.findById(eventId);
  if (!event) {
    throw new EventNotFoundError();
  }

  if (!isAdmin && event.organizer.toString() !== teacherId) {
    throw new EventForbiddenError("You can only edit events that you organize");
  }

  if (event.status === "CANCELLED" || event.status === "COMPLETED") {
    throw new EventConflictError(`Cannot edit an event that is ${event.status.toLowerCase()}`);
  }

  const targetFacilityId = updates.facilityId || event.facility.toString();
  const targetStartAt = updates.startAt ? new Date(updates.startAt) : event.startAt;
  const targetEndAt = updates.endAt ? new Date(updates.endAt) : event.endAt;

  const isTimingOrVenueChanged =
    updates.facilityId || updates.startAt || updates.endAt;

  if (isTimingOrVenueChanged && event.status !== "DRAFT") {
    if (targetEndAt <= targetStartAt) {
      throw new EventConflictError("End time must be strictly after start time");
    }

    await validateFacilityAvailabilityForEvent(
      targetFacilityId,
      targetStartAt,
      targetEndAt,
      event._id
    );

    event.facility = new Types.ObjectId(targetFacilityId);
    event.startAt = targetStartAt;
    event.endAt = targetEndAt;

    // Notify registered participants of timing changes
    const registrations = await EventRegistration.find({
      event: event._id,
      status: "CONFIRMED",
    }).select("user");

    for (const reg of registrations) {
      await createNotification({
        userId: reg.user.toString(),
        title: "Event Timing Updated",
        message: `The schedule for "${event.title}" has been updated to ${targetStartAt.toLocaleString()}.`,
        type: "EVENT_TIMING_CHANGED",
        relatedEntityType: "EVENT",
        relatedEntityId: event._id,
        idempotencyKey: `event_time_${event._id}_${reg.user}_${targetStartAt.getTime()}`,
      });
    }
  }

  if (updates.title) event.title = updates.title.trim();
  if (updates.description) event.description = updates.description.trim();
  if (updates.sportType) event.sportType = updates.sportType as any;
  if (updates.eventType) event.eventType = updates.eventType as any;
  if (updates.participantLimit) event.participantLimit = updates.participantLimit;
  if (updates.participationType) event.participationType = updates.participationType;
  if (updates.teamSizeLimit) event.teamSizeLimit = updates.teamSizeLimit;
  if (updates.rules) event.rules = updates.rules.trim();
  if (updates.bannerImage !== undefined) event.bannerImage = updates.bannerImage;
  if (updates.registrationStartAt) event.registrationStartAt = new Date(updates.registrationStartAt);
  if (updates.registrationEndAt) event.registrationEndAt = new Date(updates.registrationEndAt);

  await event.save();
  return event;
}

export async function cancelEvent(
  eventId: string,
  reason: string,
  teacherId: string,
  isAdmin = false
): Promise<IEvent> {
  await connectToDatabase();

  const event = await Event.findById(eventId);
  if (!event) {
    throw new EventNotFoundError();
  }

  if (!isAdmin && event.organizer.toString() !== teacherId) {
    throw new EventForbiddenError("You can only cancel events that you organize");
  }

  event.status = "CANCELLED";
  event.cancellationReason = reason.trim();
  event.cancelledAt = new Date();
  event.cancelledBy = new Types.ObjectId(teacherId);

  await event.save();

  // Notify registered participants
  const registrations = await EventRegistration.find({
    event: event._id,
    status: "CONFIRMED",
  }).select("user");

  for (const reg of registrations) {
    await createNotification({
      userId: reg.user.toString(),
      title: "Event Cancelled",
      message: `"${event.title}" has been cancelled. Reason: ${reason}`,
      type: "EVENT_CANCELLED",
      relatedEntityType: "EVENT",
      relatedEntityId: event._id,
      idempotencyKey: `event_cancel_${event._id}_${reg.user}`,
    });
  }

  return event;
}

export interface RegisterForEventInput {
  teamName?: string;
  teamMembers?: Array<{ name: string; email: string }>;
}

/**
 * Concurrency-safe atomic registration for an event.
 * Uses atomic conditional updates to prevent exceeding participant limits under concurrent requests.
 */
export async function registerForEvent(
  eventId: string,
  userId: string,
  input: RegisterForEventInput = {}
): Promise<IEventRegistration> {
  await connectToDatabase();

  const userObjId = new Types.ObjectId(userId);
  const eventObjId = new Types.ObjectId(eventId);

  const event = await Event.findById(eventId);
  if (!event) {
    throw new EventNotFoundError();
  }

  // 1. Status & deadline checks
  if (
    event.status === "CANCELLED" ||
    event.status === "COMPLETED" ||
    event.status === "DRAFT"
  ) {
    throw new EventConflictError(
      `Cannot register for an event that is ${event.status.toLowerCase()}`
    );
  }

  const now = new Date();
  if (now > event.registrationEndAt) {
    throw new EventConflictError("Registration for this event has closed");
  }

  // 2. Prevent duplicate active registrations for this user
  const existingActiveRegistration = await EventRegistration.findOne({
    event: eventObjId,
    user: userObjId,
    status: "CONFIRMED",
  });

  if (existingActiveRegistration) {
    throw new DuplicateRegistrationError("You are already registered for this event");
  }

  // 3. Concurrency-safe atomic capacity increment
  const updatedEvent = await Event.findOneAndUpdate(
    {
      _id: eventObjId,
      status: { $in: ["PUBLISHED", "REGISTRATION_OPEN"] },
      registrationCount: { $lt: event.participantLimit },
    },
    { $inc: { registrationCount: 1 } },
    { new: true }
  );

  if (!updatedEvent) {
    throw new EventCapacityError(
      "This event has reached its maximum participant capacity"
    );
  }

  try {
    const registration = await EventRegistration.create({
      event: eventObjId,
      user: userObjId,
      participationType: event.participationType,
      teamName: event.participationType === "TEAM" ? input.teamName?.trim() || "My Team" : null,
      teamMembers:
        event.participationType === "TEAM" && input.teamMembers
          ? input.teamMembers.map((m) => ({ name: m.name.trim(), email: m.email.trim().toLowerCase() }))
          : [],
      attendanceStatus: "REGISTERED",
      status: "CONFIRMED",
    });

    // Send confirmation notification
    await createNotification({
      userId,
      title: "Event Registration Confirmed",
      message: `You are registered for "${event.title}" on ${new Date(event.startAt).toLocaleDateString()}.`,
      type: "EVENT_REGISTRATION_CONFIRMED",
      relatedEntityType: "EVENT",
      relatedEntityId: event._id,
      idempotencyKey: `event_reg_conf_${event._id}_${userId}`,
    });

    return registration;
  } catch (err) {
    // If registration document insertion fails, roll back atomic count
    await Event.findByIdAndUpdate(eventObjId, { $inc: { registrationCount: -1 } });
    throw err;
  }
}

export async function cancelRegistration(
  eventId: string,
  userId: string
): Promise<IEventRegistration> {
  await connectToDatabase();

  const userObjId = new Types.ObjectId(userId);
  const eventObjId = new Types.ObjectId(eventId);

  const registration = await EventRegistration.findOne({
    event: eventObjId,
    user: userObjId,
    status: "CONFIRMED",
  });

  if (!registration) {
    throw new EventNotFoundError("Active registration not found");
  }

  registration.status = "CANCELLED";
  registration.cancelledAt = new Date();
  await registration.save();

  // Atomically decrement registration count
  await Event.findOneAndUpdate(
    { _id: eventObjId, registrationCount: { $gt: 0 } },
    { $inc: { registrationCount: -1 } }
  );

  return registration;
}

export interface EventFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  sportType?: string;
  eventType?: string;
  status?: string;
  facilityId?: string;
  from?: string;
  to?: string;
  mine?: boolean;
  teacherId?: string;
}

export async function getEvents(params: EventFilterParams = {}) {
  await connectToDatabase();

  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 10));
  const skip = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: any = {};

  if (params.search) {
    filter.title = { $regex: params.search.trim(), $options: "i" };
  }

  if (params.sportType && params.sportType !== "ALL") {
    filter.sportType = params.sportType;
  }

  if (params.eventType && params.eventType !== "ALL") {
    filter.eventType = params.eventType;
  }

  if (params.status && params.status !== "ALL") {
    filter.status = params.status;
  }

  if (params.facilityId) {
    filter.facility = new Types.ObjectId(params.facilityId);
  }

  if (params.mine && params.teacherId) {
    filter.organizer = new Types.ObjectId(params.teacherId);
  }

  if (params.from || params.to) {
    filter.startAt = {};
    if (params.from) filter.startAt.$gte = new Date(params.from);
    if (params.to) filter.startAt.$lte = new Date(params.to);
  }

  const [events, total] = await Promise.all([
    Event.find(filter)
      .populate("facility", "name sportType location")
      .populate("organizer", "name email role")
      .sort({ startAt: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Event.countDocuments(filter),
  ]);

  return {
    events,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function getEventById(eventId: string) {
  await connectToDatabase();

  const event = await Event.findById(eventId)
    .populate("facility", "name sportType location operatingHours")
    .populate("organizer", "name email role");

  if (!event) {
    throw new EventNotFoundError();
  }

  return event;
}

export async function getEventRegistrations(
  eventId: string,
  requesterId: string,
  isAdmin = false
) {
  await connectToDatabase();

  const event = await Event.findById(eventId);
  if (!event) {
    throw new EventNotFoundError();
  }

  if (!isAdmin && event.organizer.toString() !== requesterId) {
    throw new EventForbiddenError("Only the organizer or admin can view participant records");
  }

  const registrations = await EventRegistration.find({
    event: event._id,
  })
    .populate("user", "name email")
    .sort({ createdAt: 1 })
    .lean();

  return registrations;
}

export async function updateEventAttendance(
  eventId: string,
  records: Array<{ registrationId: string; status: "REGISTERED" | "ATTENDED" | "NO_SHOW" }>,
  teacherId: string,
  isAdmin = false
) {
  await connectToDatabase();

  const event = await Event.findById(eventId);
  if (!event) {
    throw new EventNotFoundError();
  }

  if (!isAdmin && event.organizer.toString() !== teacherId) {
    throw new EventForbiddenError("Only the organizing teacher or admin can modify attendance");
  }

  const now = new Date();
  const adminObjId = new Types.ObjectId(teacherId);

  const updates = records.map((rec) =>
    EventRegistration.findByIdAndUpdate(rec.registrationId, {
      attendanceStatus: rec.status,
      markedAt: now,
      markedBy: adminObjId,
    })
  );

  await Promise.all(updates);
  return { updatedCount: records.length };
}

export async function updateTournamentMatch(
  eventId: string,
  matchData: Omit<Partial<ITournamentMatch>, "scheduledTime"> & {
    matchId: string;
    scheduledTime?: Date | string | null;
  },
  teacherId: string,
  isAdmin = false
) {
  await connectToDatabase();

  const event = await Event.findById(eventId);
  if (!event) {
    throw new EventNotFoundError();
  }

  if (!isAdmin && event.organizer.toString() !== teacherId) {
    throw new EventForbiddenError("Only the event organizer or admin can score tournament matches");
  }

  const match = event.tournamentMatches.find((m) => m.matchId === matchData.matchId);
  if (!match) {
    throw new EventNotFoundError("Tournament match not found");
  }

  if (matchData.score1 !== undefined) match.score1 = matchData.score1;
  if (matchData.score2 !== undefined) match.score2 = matchData.score2;
  if (matchData.status !== undefined) match.status = matchData.status;
  if (matchData.winner !== undefined) match.winner = matchData.winner;
  if (matchData.scheduledTime !== undefined) {
    match.scheduledTime = matchData.scheduledTime ? new Date(matchData.scheduledTime) : null;
  }

  await event.save();
  return match;
}

export async function createTournamentMatch(
  eventId: string,
  matchInput: { round: number; matchNumber: number; team1: string; team2: string; scheduledTime?: string },
  teacherId: string,
  isAdmin = false
) {
  await connectToDatabase();

  const event = await Event.findById(eventId);
  if (!event) {
    throw new EventNotFoundError();
  }

  if (!isAdmin && event.organizer.toString() !== teacherId) {
    throw new EventForbiddenError("Only the organizer or admin can create tournament matches");
  }

  const newMatch: ITournamentMatch = {
    matchId: new Types.ObjectId().toString(),
    round: matchInput.round,
    matchNumber: matchInput.matchNumber,
    team1: matchInput.team1.trim(),
    team2: matchInput.team2.trim(),
    scheduledTime: matchInput.scheduledTime ? new Date(matchInput.scheduledTime) : null,
    status: "SCHEDULED",
    score1: 0,
    score2: 0,
    winner: null,
  };

  event.tournamentMatches.push(newMatch);
  await event.save();
  return newMatch;
}
