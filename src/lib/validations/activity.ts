import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const SPORT_TYPES = [
  "BADMINTON",
  "BASKETBALL",
  "FOOTBALL",
  "CRICKET",
  "TENNIS",
  "GYM",
  "OTHER",
] as const;

export const ACTIVITY_STATUSES = [
  "ALL",
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
] as const;

export const createActivitySchema = z
  .object({
    title: z
      .string({ message: "Title is required" })
      .trim()
      .min(2, "Title must be at least 2 characters")
      .max(120, "Title cannot exceed 120 characters"),
    description: z
      .string()
      .trim()
      .max(1000, "Description cannot exceed 1000 characters")
      .optional()
      .default(""),
    sportType: z.enum(SPORT_TYPES, {
      message: "Please select a valid sport type",
    }),
    facilityId: z
      .string({ message: "Facility ID is required" })
      .regex(objectIdRegex, "Invalid facility ID format"),
    startAt: z
      .string({ message: "Start time is required" })
      .datetime({ message: "Start time must be a valid ISO 8601 string" }),
    endAt: z
      .string({ message: "End time is required" })
      .datetime({ message: "End time must be a valid ISO 8601 string" }),
    participantLimit: z.coerce
      .number()
      .int()
      .min(1, "Participant limit must be at least 1")
      .max(200, "Participant limit cannot exceed 200")
      .default(20),
  })
  .refine(
    (data) => new Date(data.endAt) > new Date(data.startAt),
    {
      message: "End time must be strictly after start time",
      path: ["endAt"],
    }
  );

export const updateActivitySchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(2, "Title must be at least 2 characters")
      .max(120, "Title cannot exceed 120 characters")
      .optional(),
    description: z
      .string()
      .trim()
      .max(1000, "Description cannot exceed 1000 characters")
      .optional(),
    sportType: z.enum(SPORT_TYPES).optional(),
    facilityId: z.string().regex(objectIdRegex, "Invalid facility ID format").optional(),
    startAt: z.string().datetime({ message: "Start time must be a valid ISO string" }).optional(),
    endAt: z.string().datetime({ message: "End time must be a valid ISO string" }).optional(),
    participantLimit: z.coerce.number().int().min(1).max(200).optional(),
    status: z.enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
  })
  .refine(
    (data) => {
      if (data.startAt && data.endAt) {
        return new Date(data.endAt) > new Date(data.startAt);
      }
      return true;
    },
    {
      message: "End time must be strictly after start time",
      path: ["endAt"],
    }
  );

export const cancelActivitySchema = z.object({
  reason: z
    .string()
    .trim()
    .max(500, "Cancellation reason cannot exceed 500 characters")
    .optional(),
});

export const activityQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  facilityId: z.string().trim().optional(),
  sportType: z.string().trim().optional(),
  status: z.enum(ACTIVITY_STATUSES).default("ALL"),
  from: z.string().trim().optional(),
  to: z.string().trim().optional(),
  mine: z.coerce.boolean().optional(),
});

export const markAttendanceSchema = z.object({
  participantId: z.string().regex(objectIdRegex, "Invalid participant ID format"),
  status: z.enum(["REGISTERED", "PRESENT", "ABSENT"]),
});

export const bulkAttendanceSchema = z.object({
  records: z
    .array(
      z.object({
        participantId: z.string().regex(objectIdRegex, "Invalid participant ID format"),
        status: z.enum(["REGISTERED", "PRESENT", "ABSENT"]),
      })
    )
    .min(1, "At least one attendance record is required"),
});

