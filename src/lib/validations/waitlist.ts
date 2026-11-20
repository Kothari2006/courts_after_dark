import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const joinWaitlistSchema = z.object({
  facilityId: z
    .string({ message: "Facility ID is required" })
    .regex(objectIdRegex, "Invalid facility ID format"),
  startAt: z
    .string({ message: "Start time is required" })
    .datetime({ message: "Start time must be a valid ISO 8601 string" }),
  endAt: z
    .string({ message: "End time is required" })
    .datetime({ message: "End time must be a valid ISO 8601 string" }),
});

export type JoinWaitlistInput = z.infer<typeof joinWaitlistSchema>;

