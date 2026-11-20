import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createMaintenanceReportSchema = z.object({
  type: z.enum(["FACILITY", "EQUIPMENT"], {
    message: "Report type must be FACILITY or EQUIPMENT",
  }),
  facilityId: z.string().regex(objectIdRegex, "Invalid facility ID format").optional().nullable(),
  equipmentId: z.string().regex(objectIdRegex, "Invalid equipment ID format").optional().nullable(),
  title: z
    .string({ message: "Title is required" })
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(150, "Title cannot exceed 150 characters"),
  description: z
    .string({ message: "Description is required" })
    .trim()
    .min(5, "Description must be at least 5 characters")
    .max(1000, "Description cannot exceed 1000 characters"),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
});

export const maintenanceReportQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  status: z.enum(["ALL", "PENDING", "ACKNOWLEDGED", "RESOLVED"]).default("ALL"),
  type: z.enum(["ALL", "FACILITY", "EQUIPMENT"]).default("ALL"),
});

