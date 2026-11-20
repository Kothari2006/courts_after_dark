import mongoose from "mongoose";
import { notifyWaitlistJoined, notifyWaitlistPromoted } from "./notification.service";
import connectToDatabase from "@/lib/mongodb";
import Booking, { IBooking, AttendanceStatus } from "@/models/Booking";
import Facility, { IFacility } from "@/models/Facility";
import User, { IUser } from "@/models/User";
import Waitlist, { IWaitlist } from "@/models/Waitlist";
import { formatInTimezone, getActiveBookingPolicy } from "./booking.service";
import { hasIntervalOverlap } from "./availability.service";

export interface JoinWaitlistParams {
  userId: string;
  facilityId: string;
  startAt: string | Date;
  endAt: string | Date;
}

export interface LeaveWaitlistParams {
  waitlistId: string;
  userId: string;
  isAdmin?: boolean;
}

export interface RecordAttendanceParams {
  bookingId: string;
  attendanceStatus: AttendanceStatus;
  adminId: string;
}

/**
 * Converts "HH:mm" time string into total minutes from midnight.
 */
function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Checks whether a requested time interval overlaps prime-time hours
 * using the facility's local timezone.
 */
export function isSlotPrimeTime(
  startAt: Date,
  endAt: Date,
  timezone: string,
  primeTimeStart: string,
  primeTimeEnd: string
): boolean {
  const startLocal = formatInTimezone(startAt, timezone);
  const endLocal = formatInTimezone(endAt, timezone);

  const slotStartMinutes = timeToMinutes(startLocal.timeStr);
  let slotEndMinutes = timeToMinutes(endLocal.timeStr);
  if (slotEndMinutes === 0 || slotEndMinutes < slotStartMinutes) {
    slotEndMinutes = 24 * 60;
  }

  const primeStartMinutes = timeToMinutes(primeTimeStart);
  let primeEndMinutes = timeToMinutes(primeTimeEnd);
  if (primeEndMinutes === 0 || primeEndMinutes < primeStartMinutes) {
    primeEndMinutes = 24 * 60;
  }

  return hasIntervalOverlap(
    slotStartMinutes,
    slotEndMinutes,
    primeStartMinutes,
    primeEndMinutes
  );
}

/**
 * Calculates the number of active prime-time reservations a user has on a specific local date.
 */
export async function getUserPrimeTimeBookingsForDate(
  userId: string,
  localDateStr: string,
  timezone: string
): Promise<number> {
  await connectToDatabase();

  const primeBookings = await Booking.find({
    user: new mongoose.Types.ObjectId(userId),
    status: { $in: ["CONFIRMED", "PENDING"] },
    bookingType: "PRIME_TIME",
  })
    .select("startAt endAt bookingDate")
    .lean<IBooking[]>();

  return primeBookings.filter((b) => {
    const local = formatInTimezone(new Date(b.startAt), timezone);
    return local.dateStr === localDateStr;
  }).length;
}

/**
 * Validates fair booking allocation rules (active limits, daily prime-time limits).
 */
export async function validateBookingFairness({
  userId,
  facility,
  startDate,
  endDate,
  policy,
}: {
  userId: string;
  facility: IFacility;
  startDate: Date;
  endDate: Date;
  policy: Awaited<ReturnType<typeof getActiveBookingPolicy>>;
}) {
  const timezone = facility.timezone || "Asia/Kolkata";
  const startLocal = formatInTimezone(startDate, timezone);

  // 1. Prime-Time Monopolisation Check
  const isPrimeTime = isSlotPrimeTime(
    startDate,
    endDate,
    timezone,
    policy.primeTimeStart,
    policy.primeTimeEnd
  );

  if (isPrimeTime) {
    const existingPrimeCount = await getUserPrimeTimeBookingsForDate(
      userId,
      startLocal.dateStr,
      timezone
    );

    if (existingPrimeCount >= policy.maxPrimeTimeBookingsPerDay) {
      throw new Error("PRIME_TIME_LIMIT_EXCEEDED");
    }
  }

  return { isPrimeTime };
}

/**
 * Adds an authenticated student to the waiting list for an unavailable court slot.
 */
export async function joinWaitlist({
  userId,
  facilityId,
  startAt,
  endAt,
}: JoinWaitlistParams): Promise<IWaitlist> {
  await connectToDatabase();

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("INVALID_USER_ID");
  }
  if (!mongoose.Types.ObjectId.isValid(facilityId)) {
    throw new Error("INVALID_FACILITY_ID");
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
    throw new Error("CANNOT_WAITLIST_PAST");
  }

  const policy = await getActiveBookingPolicy();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((policy as any).enableWaitlist === false) {
    throw new Error("WAITLIST_DISABLED");
  }

  const facility = await Facility.findById(facilityId).lean<IFacility>();
  if (!facility) {
    throw new Error("FACILITY_NOT_FOUND");
  }
  if (facility.status !== "ACTIVE") {
    throw new Error("FACILITY_NOT_ACTIVE");
  }

  // Calculate local bookingDate
  const timezone = facility.timezone || "Asia/Kolkata";
  const startLocal = formatInTimezone(startDate, timezone);
  const [bYear, bMonth, bDay] = startLocal.dateStr.split("-").map(Number);
  const requestedDate = new Date(Date.UTC(bYear, bMonth - 1, bDay));

  // Determine current queue position (FIFO)
  const lastInQueue = await Waitlist.findOne({
    facility: new mongoose.Types.ObjectId(facilityId),
    startAt: startDate,
    endAt: endDate,
    status: "WAITING",
  })
    .sort({ position: -1 })
    .lean<IWaitlist>();

  const nextPosition = (lastInQueue?.position || 0) + 1;

  try {
    const entry = await Waitlist.create({
      user: new mongoose.Types.ObjectId(userId),
      facility: new mongoose.Types.ObjectId(facilityId),
      requestedDate,
      startAt: startDate,
      endAt: endDate,
      status: "WAITING",
      position: nextPosition,
    });

    await notifyWaitlistJoined(entry);
    return entry;
  } catch (err: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((err as any)?.code === 11000) {
      throw new Error("ALREADY_ON_WAITLIST");
    }
    throw err;
  }
}

/**
 * Removes a student from the waiting list.
 */
export async function leaveWaitlist({
  waitlistId,
  userId,
  isAdmin = false,
}: LeaveWaitlistParams): Promise<IWaitlist> {
  await connectToDatabase();

  if (!mongoose.Types.ObjectId.isValid(waitlistId)) {
    throw new Error("INVALID_WAITLIST_ID");
  }

  const entry = await Waitlist.findById(waitlistId);
  if (!entry) {
    throw new Error("WAITLIST_ENTRY_NOT_FOUND");
  }

  if (!isAdmin && entry.user.toString() !== userId.toString()) {
    throw new Error("FORBIDDEN");
  }

  entry.status = "CANCELLED";
  await entry.save();

  return entry;
}

/**
 * Retrieves waitlist entries for a student with facility details.
 */
export async function getUserWaitlistEntries(userId: string) {
  await connectToDatabase();

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("INVALID_USER_ID");
  }

  const entries = await Waitlist.find({
    user: new mongoose.Types.ObjectId(userId),
    status: { $in: ["WAITING", "PROMOTED"] },
  })
    .populate("facility", "name sportType location operatingHours slotDuration")
    .sort({ createdAt: -1 })
    .lean();

  return entries;
}

/**
 * Promotes the next eligible candidate from the waiting list when a court slot is freed.
 * Enforces queue ordering, active quota checks, and daily prime-time fairness.
 */
export async function promoteNextWaitlistUser({
  facilityId,
  startAt,
  endAt,
}: {
  facilityId: string | mongoose.Types.ObjectId;
  startAt: Date;
  endAt: Date;
}): Promise<{ promoted: boolean; booking?: IBooking; promotedUser?: string }> {
  await connectToDatabase();

  const policy = await getActiveBookingPolicy();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((policy as any).enableWaitlist === false) {
    return { promoted: false };
  }

  const facility = await Facility.findById(facilityId).lean<IFacility>();
  if (!facility || facility.status !== "ACTIVE") {
    return { promoted: false };
  }

  const timezone = facility.timezone || "Asia/Kolkata";
  const startLocal = formatInTimezone(startAt, timezone);
  const endLocal = formatInTimezone(endAt, timezone);
  const [bYear, bMonth, bDay] = startLocal.dateStr.split("-").map(Number);
  const bookingDate = new Date(Date.UTC(bYear, bMonth - 1, bDay));

  const isPrimeTime = isSlotPrimeTime(
    startAt,
    endAt,
    timezone,
    policy.primeTimeStart,
    policy.primeTimeEnd
  );
  const bookingType = isPrimeTime ? "PRIME_TIME" : "REGULAR";

  // Query waitlist in strict FIFO queue order
  const candidates = await Waitlist.find({
    facility: new mongoose.Types.ObjectId(facilityId),
    startAt,
    endAt,
    status: "WAITING",
  })
    .sort({ position: 1, createdAt: 1 });

  const now = new Date();

  for (const candidate of candidates) {
    const candidateUserId = candidate.user.toString();

    // 1. Verify candidate user exists and is active
    const candidateUser = await User.findById(candidateUserId).lean<IUser>();
    if (!candidateUser || !candidateUser.isActive) {
      candidate.status = "EXPIRED";
      await candidate.save();
      continue;
    }

    // 2. Verify candidate has not reached the active booking limit
    const activeCount = await Booking.countDocuments({
      user: candidate.user,
      status: { $in: ["CONFIRMED", "PENDING"] },
      endAt: { $gt: now },
    });

    if (activeCount >= policy.maxActiveBookings) {
      // User is currently ineligible due to max active bookings; mark as expired
      candidate.status = "EXPIRED";
      await candidate.save();
      continue;
    }

    // 3. Verify prime-time limit if applicable
    if (isPrimeTime) {
      const existingPrime = await getUserPrimeTimeBookingsForDate(
        candidateUserId,
        startLocal.dateStr,
        timezone
      );

      if (existingPrime >= policy.maxPrimeTimeBookingsPerDay) {
        candidate.status = "EXPIRED";
        await candidate.save();
        continue;
      }
    }

    // Candidate is eligible! Create confirmed booking and promote
    try {
      const createdBooking = await Booking.create({
        user: candidate.user,
        facility: candidate.facility,
        bookingDate,
        startTime: startLocal.timeStr,
        endTime: endLocal.timeStr,
        startAt,
        endAt,
        status: "CONFIRMED",
        bookingType,
        attendanceStatus: "PENDING",
      });

      candidate.status = "PROMOTED";
      await candidate.save();
      await notifyWaitlistPromoted(createdBooking._id.toString(), candidateUserId);

      return {
        promoted: true,
        booking: createdBooking,
        promotedUser: candidateUserId,
      };
    } catch {
      // If concurrent booking collision occurred, continue to next or terminate
      continue;
    }
  }

  return { promoted: false };
}

/**
 * Records student attendance or marks a reservation as NO_SHOW.
 */
export async function recordAttendance({
  bookingId,
  attendanceStatus,
  adminId,
}: RecordAttendanceParams): Promise<IBooking> {
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

  const now = new Date();
  booking.attendanceStatus = attendanceStatus;

  if (attendanceStatus === "NO_SHOW") {
    booking.markedNoShowAt = now;
    booking.markedNoShowBy = new mongoose.Types.ObjectId(adminId);
  } else if (attendanceStatus === "CHECKED_IN") {
    booking.markedCheckInAt = now;
    booking.markedCheckInBy = new mongoose.Types.ObjectId(adminId);
  }

  await booking.save();
  return booking;
}

/**
 * Retrieves no-show attendance records for administrator audit.
 */
export async function getNoShowHistory({
  page = 1,
  limit = 20,
}: {
  page?: number;
  limit?: number;
}) {
  await connectToDatabase();

  const skip = (Math.max(1, page) - 1) * limit;

  const [records, total] = await Promise.all([
    Booking.find({ attendanceStatus: "NO_SHOW" })
      .populate("user", "name email phoneNumber")
      .populate("facility", "name sportType location")
      .populate("markedNoShowBy", "name email")
      .sort({ markedNoShowAt: -1, startAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Booking.countDocuments({ attendanceStatus: "NO_SHOW" }),
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
