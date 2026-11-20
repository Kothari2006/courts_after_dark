import { z } from "zod";

const timeFormatRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const updatePolicySchema = z.object({
  maxActiveBookings: z.number().int().min(1).max(10).optional(),
  maxAdvanceBookingDays: z.number().int().min(1).max(30).optional(),
  maxBookingDurationMinutes: z.number().int().min(15).max(240).optional(),
  cancellationDeadlineHours: z.number().int().min(0).max(24).optional(),
  maxPrimeTimeBookingsPerDay: z.number().int().min(1).max(5).optional(),
  primeTimeStart: z
    .string()
    .regex(timeFormatRegex, "Prime time start must be HH:mm 24h format")
    .optional(),
  primeTimeEnd: z
    .string()
    .regex(timeFormatRegex, "Prime time end must be HH:mm 24h format")
    .optional(),
  enableWaitlist: z.boolean().optional(),
  enableNoShowTracking: z.boolean().optional(),
});

export type UpdatePolicyInput = z.infer<typeof updatePolicySchema>;

