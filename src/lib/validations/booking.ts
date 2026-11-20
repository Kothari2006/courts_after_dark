import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createBookingSchema = z
  .object({
    facilityId: z
      .string({ message: "Facility ID is required" })
      .regex(objectIdRegex, "Invalid facility ID format"),
    startAt: z
      .string({ message: "Start time is required" })
      .datetime({ message: "Start time must be a valid ISO 8601 string" }),
    endAt: z
      .string({ message: "End time is required" })
      .datetime({ message: "End time must be a valid ISO 8601 string" }),
  })
  .refine(
    (data) => new Date(data.endAt) > new Date(data.startAt),
    {
      message: "End time must be strictly after start time",
      path: ["endAt"],
    }
  );

export const cancelBookingSchema = z.object({
  reason: z
    .string()
    .trim()
    .max(500, "Cancellation reason cannot exceed 500 characters")
    .optional(),
});

export const adminBookingQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  status: z
    .enum(["ALL", "PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "REJECTED"])
    .default("ALL"),
  facilityId: z.string().trim().optional(),
  sportType: z.string().trim().optional(),
  bookingType: z.enum(["ALL", "REGULAR", "PRIME_TIME"]).default("ALL"),
  startDate: z.string().trim().optional(),
  endDate: z.string().trim().optional(),
  sort: z.string().trim().default("startAt:desc"),
});

export const adminUpdateBookingStatusSchema = z
  .object({
    status: z.enum(["CONFIRMED", "CANCELLED", "REJECTED", "COMPLETED"]),
    reason: z
      .string()
      .trim()
      .max(500, "Reason cannot exceed 500 characters")
      .optional(),
  })
  .refine(
    (data) => {
      if (data.status === "CANCELLED") {
        return !!data.reason && data.reason.trim().length >= 3;
      }
      return true;
    },
    {
      message: "A cancellation reason of at least 3 characters is required",
      path: ["reason"],
    }
  );

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;
export type AdminBookingQueryInput = z.infer<typeof adminBookingQuerySchema>;
export type AdminUpdateBookingStatusInput = z.infer<typeof adminUpdateBookingStatusSchema>;

