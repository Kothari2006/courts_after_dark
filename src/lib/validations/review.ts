import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createReviewSchema = z.object({
  bookingId: z
    .string({ message: "Booking ID is required" })
    .regex(objectIdRegex, "Invalid booking ID format"),
  rating: z.coerce
    .number({ message: "Rating must be a number" })
    .int("Rating must be an integer")
    .min(1, "Rating must be between 1 and 5 stars")
    .max(5, "Rating must be between 1 and 5 stars"),
  title: z
    .string()
    .trim()
    .max(100, "Review title cannot exceed 100 characters")
    .optional()
    .default(""),
  comment: z
    .string({ message: "Review comment is required" })
    .trim()
    .min(5, "Review comment must be at least 5 characters long")
    .max(1000, "Review comment cannot exceed 1000 characters"),
});

export const adminModerateReviewSchema = z
  .object({
    status: z.enum(["APPROVED", "REJECTED"], {
      message: "Status must be either APPROVED or REJECTED",
    }),
    reason: z
      .string()
      .trim()
      .max(500, "Moderation reason cannot exceed 500 characters")
      .optional()
      .default(""),
  })
  .refine(
    (data) => {
      if (data.status === "REJECTED") {
        return !!data.reason && data.reason.trim().length >= 3;
      }
      return true;
    },
    {
      message: "A rejection reason of at least 3 characters is required when rejecting a review",
      path: ["reason"],
    }
  );

export const reviewQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z.enum(["ALL", "PENDING", "APPROVED", "REJECTED"]).default("ALL"),
  facilityId: z.string().regex(objectIdRegex, "Invalid facility ID format").optional(),
  search: z.string().trim().optional(),
});

