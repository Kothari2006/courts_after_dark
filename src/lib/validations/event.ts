import { z } from "zod";
import { SPORT_TYPES } from "./activity";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const EVENT_TYPES = [
  "FRIENDLY_MATCH",
  "TOURNAMENT",
  "PRACTICE",
  "COLLEGE_EVENT",
] as const;

export const EVENT_STATUSES = [
  "ALL",
  "DRAFT",
  "PUBLISHED",
  "REGISTRATION_OPEN",
  "REGISTRATION_CLOSED",
  "ONGOING",
  "COMPLETED",
  "CANCELLED",
] as const;

export const createEventSchema = z
  .object({
    title: z
      .string({ message: "Event title is required" })
      .trim()
      .min(3, "Title must be at least 3 characters")
      .max(150, "Title cannot exceed 150 characters"),
    description: z
      .string({ message: "Description is required" })
      .trim()
      .min(10, "Description must be at least 10 characters")
      .max(2000, "Description cannot exceed 2000 characters"),
    sportType: z.enum(SPORT_TYPES, {
      message: "Please select a valid sport type",
    }),
    eventType: z.enum(EVENT_TYPES, {
      message: "Please select a valid event type",
    }),
    facilityId: z
      .string({ message: "Facility ID is required" })
      .regex(objectIdRegex, "Invalid facility ID format"),
    startAt: z
      .string({ message: "Start time is required" })
      .datetime({ message: "Start time must be a valid ISO string" }),
    endAt: z
      .string({ message: "End time is required" })
      .datetime({ message: "End time must be a valid ISO string" }),
    registrationStartAt: z
      .string({ message: "Registration start time is required" })
      .datetime({ message: "Registration start must be a valid ISO string" }),
    registrationEndAt: z
      .string({ message: "Registration deadline is required" })
      .datetime({ message: "Registration deadline must be a valid ISO string" }),
    participantLimit: z.coerce
      .number({ message: "Participant limit is required" })
      .int()
      .min(2, "Participant limit must be at least 2")
      .max(500, "Participant limit cannot exceed 500"),
    participationType: z.enum(["INDIVIDUAL", "TEAM"]).default("INDIVIDUAL"),
    teamSizeLimit: z.coerce
      .number()
      .int()
      .min(1, "Team size must be at least 1")
      .max(25, "Team size cannot exceed 25")
      .default(1),
    rules: z
      .string()
      .trim()
      .max(3000, "Rules cannot exceed 3000 characters")
      .optional()
      .default("Standard university athletic tournament regulations apply."),
    bannerImage: z.string().trim().optional().nullable(),
    isDraft: z.boolean().optional().default(false),
  })
  .refine((data) => new Date(data.endAt) > new Date(data.startAt), {
    message: "Event end time must be strictly after start time",
    path: ["endAt"],
  })
  .refine(
    (data) => new Date(data.registrationEndAt) >= new Date(data.registrationStartAt),
    {
      message: "Registration deadline must be on or after registration start time",
      path: ["registrationEndAt"],
    }
  )
  .refine(
    (data) => new Date(data.registrationEndAt) <= new Date(data.startAt),
    {
      message: "Registration deadline must be on or before the event start time",
      path: ["registrationEndAt"],
    }
  );

export const updateEventSchema = z
  .object({
    title: z.string().trim().min(3).max(150).optional(),
    description: z.string().trim().min(10).max(2000).optional(),
    sportType: z.enum(SPORT_TYPES).optional(),
    eventType: z.enum(EVENT_TYPES).optional(),
    facilityId: z.string().regex(objectIdRegex).optional(),
    startAt: z.string().datetime().optional(),
    endAt: z.string().datetime().optional(),
    registrationStartAt: z.string().datetime().optional(),
    registrationEndAt: z.string().datetime().optional(),
    participantLimit: z.coerce.number().int().min(2).max(500).optional(),
    participationType: z.enum(["INDIVIDUAL", "TEAM"]).optional(),
    teamSizeLimit: z.coerce.number().int().min(1).max(25).optional(),
    rules: z.string().trim().max(3000).optional(),
    bannerImage: z.string().trim().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.startAt && data.endAt) {
        return new Date(data.endAt) > new Date(data.startAt);
      }
      return true;
    },
    {
      message: "Event end time must be strictly after start time",
      path: ["endAt"],
    }
  );

export const cancelEventSchema = z.object({
  reason: z
    .string({ message: "Cancellation reason is required" })
    .trim()
    .min(3, "Cancellation reason must be at least 3 characters")
    .max(500, "Cancellation reason cannot exceed 500 characters"),
});

export const eventQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  search: z.string().trim().optional(),
  sportType: z.string().trim().optional(),
  eventType: z.string().trim().optional(),
  status: z.enum(EVENT_STATUSES).default("ALL"),
  facilityId: z.string().regex(objectIdRegex).optional(),
  from: z.string().trim().optional(),
  to: z.string().trim().optional(),
  mine: z.coerce.boolean().optional(),
});

export const registerForEventSchema = z.object({
  teamName: z.string().trim().max(100).optional(),
  teamMembers: z
    .array(
      z.object({
        name: z.string().trim().min(2, "Member name is required"),
        email: z.string().trim().email("Member email must be valid"),
      })
    )
    .optional(),
});

export const updateAttendanceSchema = z.object({
  records: z
    .array(
      z.object({
        registrationId: z.string().regex(objectIdRegex, "Invalid registration ID format"),
        status: z.enum(["REGISTERED", "ATTENDED", "NO_SHOW"]),
      })
    )
    .min(1, "At least one attendance record is required"),
});

export const updateMatchSchema = z.object({
  matchId: z.string(),
  scheduledTime: z.string().datetime().optional().nullable(),
  score1: z.coerce.number().int().min(0).optional(),
  score2: z.coerce.number().int().min(0).optional(),
  winner: z.string().trim().optional().nullable(),
  status: z.enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED"]).optional(),
});

export const createMatchSchema = z.object({
  round: z.coerce.number().int().min(1),
  matchNumber: z.coerce.number().int().min(1),
  team1: z.string().trim().min(1, "Team 1 is required"),
  team2: z.string().trim().min(1, "Team 2 is required"),
  scheduledTime: z.string().datetime().optional(),
});
