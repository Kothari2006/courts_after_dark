import { z } from "zod";

export const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const notificationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  unreadOnly: z
    .preprocess((val) => val === "true" || val === true, z.boolean())
    .default(false),
});

export const notificationIdSchema = z.object({
  id: z.string().regex(objectIdRegex, "Invalid notification ID format"),
});

export type NotificationQueryInput = z.infer<typeof notificationQuerySchema>;

