import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createMaintenanceSchema = z
  .object({
    facilityId: z
      .string({ message: "Facility ID is required" })
      .regex(objectIdRegex, "Invalid facility ID format"),
    startAt: z
      .string({ message: "Start date/time is required" })
      .datetime({ message: "Start timestamp must be a valid ISO 8601 string" }),
    endAt: z
      .string({ message: "End date/time is required" })
      .datetime({ message: "End timestamp must be a valid ISO 8601 string" }),
    reason: z
      .string({ message: "Maintenance reason is required" })
      .trim()
      .min(3, "Reason must be at least 3 characters")
      .max(500, "Reason cannot exceed 500 characters"),
    notes: z
      .string()
      .trim()
      .max(1000, "Notes cannot exceed 1000 characters")
      .optional()
      .default(""),
    status: z
      .enum(["SCHEDULED", "IN_PROGRESS"] as const)
      .default("SCHEDULED"),
  })
  .refine(
    (data) => new Date(data.endAt) > new Date(data.startAt),
    {
      message: "End time must be strictly after start time",
      path: ["endAt"],
    }
  );

export const updateMaintenanceSchema = z
  .object({
    facilityId: z.string().regex(objectIdRegex).optional(),
    startAt: z.string().datetime().optional(),
    endAt: z.string().datetime().optional(),
    reason: z.string().trim().min(3).max(500).optional(),
    notes: z.string().trim().max(1000).optional(),
    status: z
      .enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const)
      .optional(),
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

export const cancelMaintenanceSchema = z.object({
  reason: z
    .string()
    .trim()
    .max(500, "Cancellation reason cannot exceed 500 characters")
    .optional()
    .default(""),
});

export const completeMaintenanceSchema = z.object({
  notes: z
    .string()
    .trim()
    .max(1000, "Completion notes cannot exceed 1000 characters")
    .optional()
    .default(""),
});

export const checkConflictsSchema = z
  .object({
    facilityId: z.string().regex(objectIdRegex, "Invalid facility ID"),
    startAt: z.string().datetime(),
    endAt: z.string().datetime(),
    excludeMaintenanceId: z.string().regex(objectIdRegex).optional(),
  })
  .refine((data) => new Date(data.endAt) > new Date(data.startAt), {
    message: "End time must be strictly after start time",
    path: ["endAt"],
  });

export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>;
export type UpdateMaintenanceInput = z.infer<typeof updateMaintenanceSchema>;
export type CancelMaintenanceInput = z.infer<typeof cancelMaintenanceSchema>;
export type CompleteMaintenanceInput = z.infer<typeof completeMaintenanceSchema>;
export type CheckConflictsInput = z.infer<typeof checkConflictsSchema>;

