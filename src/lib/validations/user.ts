import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const listUsersQuerySchema = z.object({
  search: z.string().optional().default(""),
  role: z
    .enum(["ALL", "STUDENT", "TEACHER", "ADMIN", "EQUIPMENT_MANAGER"])
    .default("ALL"),
  status: z.enum(["ALL", "ACTIVE", "INACTIVE"]).default("ALL"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  sort: z.enum(["asc", "desc"]).default("desc"),
});

export type ListUsersQueryInput = z.infer<typeof listUsersQuerySchema>;

export const updateUserRoleSchema = z.object({
  role: z.enum(["STUDENT", "TEACHER", "ADMIN", "EQUIPMENT_MANAGER"], {
    message: "Role must be STUDENT, TEACHER, ADMIN, or EQUIPMENT_MANAGER",
  }),
  reason: z
    .string()
    .trim()
    .max(500, "Reason cannot exceed 500 characters")
    .optional()
    .default(""),
});

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;

export const updateUserStatusSchema = z.object({
  isActive: z.boolean({
    message: "isActive must be a boolean value",
  }),
  reason: z
    .string()
    .trim()
    .max(500, "Reason cannot exceed 500 characters")
    .optional()
    .default(""),
});

export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;

export const userIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, "Invalid user ID format"),
});

