import { z } from "zod";

export const SPORT_TYPES = [
  "BADMINTON",
  "BASKETBALL",
  "FOOTBALL",
  "CRICKET",
  "TENNIS",
  "GYM",
  "OTHER",
] as const;

export const FACILITY_STATUSES = [
  "ACTIVE",
  "INACTIVE",
  "MAINTENANCE",
] as const;

const timeFormatRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const operatingHoursSchema = z.object({
  open: z
    .string()
    .regex(timeFormatRegex, "Opening time must be in HH:mm 24-hour format (e.g. 06:00)"),
  close: z
    .string()
    .regex(timeFormatRegex, "Closing time must be in HH:mm 24-hour format (e.g. 23:00)"),
});

export const createFacilitySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Facility name must be at least 2 characters")
    .max(150, "Facility name cannot exceed 150 characters"),
  description: z
    .string()
    .trim()
    .min(5, "Description must be at least 5 characters")
    .max(1000, "Description cannot exceed 1000 characters"),
  sportType: z.enum(SPORT_TYPES, {
    message: "Invalid sport type",
  }),
  location: z
    .string()
    .trim()
    .min(2, "Location must be at least 2 characters")
    .max(150, "Location cannot exceed 150 characters"),
  capacity: z
    .number({ message: "Capacity must be a number" })
    .int("Capacity must be an integer")
    .min(1, "Capacity must be at least 1 player")
    .max(500, "Capacity cannot exceed 500 players"),
  images: z
    .array(z.string().url("Image must be a valid URL"))
    .default([]),
  operatingHours: operatingHoursSchema,
  slotDuration: z
    .number({ message: "Slot duration must be a number" })
    .int("Slot duration must be an integer")
    .min(15, "Slot duration must be at least 15 minutes")
    .max(240, "Slot duration cannot exceed 240 minutes")
    .default(60),
  timezone: z.string().default("Asia/Kolkata"),
  status: z.enum(FACILITY_STATUSES, {
    message: "Invalid status",
  }).default("ACTIVE"),
});

export const updateFacilitySchema = createFacilitySchema.partial();

export type CreateFacilityInput = z.infer<typeof createFacilitySchema>;
export type UpdateFacilityInput = z.infer<typeof updateFacilitySchema>;

