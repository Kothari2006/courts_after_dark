import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongodb";
import Facility, { IFacility } from "@/models/Facility";
import Booking, { IBooking, BookingStatus } from "@/models/Booking";
import Maintenance, { IMaintenance, MaintenanceStatus } from "@/models/Maintenance";

export type SlotStatus = "AVAILABLE" | "BOOKED" | "MAINTENANCE" | "UNAVAILABLE";

export interface TimeSlot {
  startAt: string; // ISO UTC string
  endAt: string;   // ISO UTC string
  startTime: string; // "06:00" in local timezone
  endTime: string;   // "07:00" in local timezone
  status: SlotStatus;
  reason?: string;
}

export interface FacilityAvailabilityResult {
  success: boolean;
  facilityId: string;
  facilityName: string;
  sportType: string;
  date: string;
  timezone: string;
  operatingHours: { open: string; close: string };
  slotDuration: number;
  totalSlots: number;
  availableSlotsCount: number;
  slots: TimeSlot[];
}

/**
 * Converts a local date string (YYYY-MM-DD) and time string (HH:mm)
 * in a specific IANA timezone to an exact UTC Date object.
 * Robust against Daylight Saving Time (DST) shifts.
 */
export function localToUTC(dateStr: string, timeStr: string, timezone: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr.split(":").map(Number);

  // Initial estimate in UTC
  const targetUtc = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0));

  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: false,
    });

    const parts = formatter.formatToParts(targetUtc);
    let tzYear = year;
    let tzMonth = month;
    let tzDay = day;
    let tzHour = hours;
    let tzMinute = minutes;

    for (const p of parts) {
      if (p.type === "year") tzYear = parseInt(p.value, 10);
      if (p.type === "month") tzMonth = parseInt(p.value, 10);
      if (p.type === "day") tzDay = parseInt(p.value, 10);
      if (p.type === "hour") {
        const val = parseInt(p.value, 10);
        tzHour = val === 24 ? 0 : val;
      }
      if (p.type === "minute") tzMinute = parseInt(p.value, 10);
    }

    const asLocalInTz = Date.UTC(tzYear, tzMonth - 1, tzDay, tzHour, tzMinute, 0, 0);
    const diff = asLocalInTz - targetUtc.getTime();

    return new Date(targetUtc.getTime() - diff);
  } catch {
    // Fallback if timezone string is invalid
    return targetUtc;
  }
}

/**
 * Formats minutes from midnight into "HH:mm" 24h format.
 */
export function minutesToTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

/**
 * Checks whether two time intervals [startA, endA) and [startB, endB) overlap.
 * Uses strict interval math: startA < endB && endA > startB
 */
export function hasIntervalOverlap(
  startA: Date | number,
  endA: Date | number,
  startB: Date | number,
  endB: Date | number
): boolean {
  const tStartA = typeof startA === "number" ? startA : startA.getTime();
  const tEndA = typeof endA === "number" ? endA : endA.getTime();
  const tStartB = typeof startB === "number" ? startB : startB.getTime();
  const tEndB = typeof endB === "number" ? endB : endB.getTime();

  return tStartA < tEndB && tEndA > tStartB;
}

/**
 * Generates all discrete time slots for a facility on a specific date based on operating hours.
 */
export function generateFacilityTimeSlots(
  facility: {
    operatingHours: { open: string; close: string };
    slotDuration: number;
    timezone?: string;
  },
  dateStr: string
): Array<{
  startTime: string;
  endTime: string;
  startAt: Date;
  endAt: Date;
}> {
  const timezone = facility.timezone || "Asia/Kolkata";
  const slotDuration = facility.slotDuration || 60;

  const [openH, openM] = facility.operatingHours.open.split(":").map(Number);
  const [closeH, closeM] = facility.operatingHours.close.split(":").map(Number);

  const openMinutes = openH * 60 + openM;
  let closeMinutes = closeH * 60 + closeM;

  // Handle midnight closing (e.g. 00:00 as 24:00)
  if (closeMinutes === 0 || closeMinutes <= openMinutes) {
    closeMinutes = 24 * 60;
  }

  const slots: Array<{
    startTime: string;
    endTime: string;
    startAt: Date;
    endAt: Date;
  }> = [];

  let currentStart = openMinutes;

  while (currentStart + slotDuration <= closeMinutes) {
    const currentEnd = currentStart + slotDuration;
    const startTimeStr = minutesToTimeString(currentStart);
    const endTimeStr = minutesToTimeString(currentEnd);

    const startAt = localToUTC(dateStr, startTimeStr, timezone);
    const endAt = localToUTC(dateStr, endTimeStr, timezone);

    slots.push({
      startTime: startTimeStr,
      endTime: endTimeStr,
      startAt,
      endAt,
    });

    currentStart += slotDuration;
  }

  return slots;
}

/**
 * Active booking statuses that reserve facility capacity.
 * CANCELLED and REJECTED bookings release facility capacity and do NOT block slots.
 */
export const BLOCKING_BOOKING_STATUSES: BookingStatus[] = ["CONFIRMED", "PENDING", "COMPLETED"];

/**
 * Active maintenance statuses that block facility slots.
 * COMPLETED and CANCELLED maintenance do NOT block future slots.
 */
export const BLOCKING_MAINTENANCE_STATUSES: MaintenanceStatus[] = ["SCHEDULED", "IN_PROGRESS"];

/**
 * Calculates dynamic availability for a facility on a given date.
 */
export async function calculateFacilityAvailability(
  facilityId: string,
  dateStr: string,
  referenceNow: Date = new Date()
): Promise<FacilityAvailabilityResult> {
  if (!mongoose.Types.ObjectId.isValid(facilityId)) {
    throw new Error("INVALID_ID");
  }

  // Validate date format YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw new Error("INVALID_DATE_FORMAT");
  }

  await connectToDatabase();

  const facility = await Facility.findById(facilityId).lean<IFacility>();
  if (!facility) {
    throw new Error("FACILITY_NOT_FOUND");
  }

  if (facility.status === "INACTIVE") {
    throw new Error("FACILITY_INACTIVE");
  }

  const timezone = facility.timezone || "Asia/Kolkata";
  const rawSlots = generateFacilityTimeSlots(facility, dateStr);

  if (rawSlots.length === 0) {
    return {
      success: true,
      facilityId: facility._id.toString(),
      facilityName: facility.name,
      sportType: facility.sportType,
      date: dateStr,
      timezone,
      operatingHours: facility.operatingHours,
      slotDuration: facility.slotDuration,
      totalSlots: 0,
      availableSlotsCount: 0,
      slots: [],
    };
  }

  // Window bounds for database query optimization
  const windowStart = rawSlots[0].startAt;
  const windowEnd = rawSlots[rawSlots.length - 1].endAt;

  // Query only relevant overlapping bookings and maintenance
  const [existingBookings, activeMaintenance] = await Promise.all([
    Booking.find({
      facility: facility._id,
      status: { $in: BLOCKING_BOOKING_STATUSES },
      startAt: { $lt: windowEnd },
      endAt: { $gt: windowStart },
    })
      .select("startAt endAt status bookingType")
      .lean<IBooking[]>(),

    Maintenance.find({
      facility: facility._id,
      status: { $in: BLOCKING_MAINTENANCE_STATUSES },
      startAt: { $lt: windowEnd },
      endAt: { $gt: windowStart },
    })
      .select("startAt endAt status reason")
      .lean<IMaintenance[]>(),
  ]);

  let availableCount = 0;

  const slots: TimeSlot[] = rawSlots.map((slot) => {
    // If the facility overall is set to MAINTENANCE, block all slots
    if (facility.status === "MAINTENANCE") {
      return {
        startAt: slot.startAt.toISOString(),
        endAt: slot.endAt.toISOString(),
        startTime: slot.startTime,
        endTime: slot.endTime,
        status: "MAINTENANCE",
        reason: "Facility is temporarily closed for facility-wide maintenance",
      };
    }

    // 1. Check for Maintenance Overlap
    const maintenanceConflict = activeMaintenance.find((m) =>
      hasIntervalOverlap(slot.startAt, slot.endAt, m.startAt, m.endAt)
    );

    if (maintenanceConflict) {
      return {
        startAt: slot.startAt.toISOString(),
        endAt: slot.endAt.toISOString(),
        startTime: slot.startTime,
        endTime: slot.endTime,
        status: "MAINTENANCE",
        reason: maintenanceConflict.reason || "Scheduled court maintenance",
      };
    }

    // 2. Check for Booking Overlap
    const bookingConflict = existingBookings.find((b) =>
      hasIntervalOverlap(slot.startAt, slot.endAt, b.startAt, b.endAt)
    );

    if (bookingConflict) {
      return {
        startAt: slot.startAt.toISOString(),
        endAt: slot.endAt.toISOString(),
        startTime: slot.startTime,
        endTime: slot.endTime,
        status: "BOOKED",
      };
    }

    // 3. Check if slot has already elapsed in the past
    if (slot.endAt.getTime() <= referenceNow.getTime()) {
      return {
        startAt: slot.startAt.toISOString(),
        endAt: slot.endAt.toISOString(),
        startTime: slot.startTime,
        endTime: slot.endTime,
        status: "UNAVAILABLE",
        reason: "Slot has already passed",
      };
    }

    // 4. Slot is free & bookable
    availableCount++;
    return {
      startAt: slot.startAt.toISOString(),
      endAt: slot.endAt.toISOString(),
      startTime: slot.startTime,
      endTime: slot.endTime,
      status: "AVAILABLE",
    };
  });

  return {
    success: true,
    facilityId: facility._id.toString(),
    facilityName: facility.name,
    sportType: facility.sportType,
    date: dateStr,
    timezone,
    operatingHours: facility.operatingHours,
    slotDuration: facility.slotDuration,
    totalSlots: slots.length,
    availableSlotsCount: availableCount,
    slots,
  };
}

