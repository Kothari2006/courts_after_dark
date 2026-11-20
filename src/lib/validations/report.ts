import { z } from "zod";

export const reportQuerySchema = z.object({
  period: z.enum(["7d", "30d", "90d", "custom"]).default("30d"),
  startDate: z.string().trim().optional(),
  endDate: z.string().trim().optional(),
  format: z.enum(["preview", "csv"]).default("preview"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.string().trim().optional(),
  sportType: z.string().trim().optional(),
  role: z.string().trim().optional(),
  accountStatus: z.string().trim().optional(),
  facilityId: z.string().trim().optional(),
});

export type ReportQueryInput = z.infer<typeof reportQuerySchema>;

