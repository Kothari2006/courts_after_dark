import { z } from "zod";

export const analyticsQuerySchema = z
  .object({
    period: z.enum(["7d", "30d", "90d", "custom"]).default("30d"),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.period === "custom") {
        if (!data.startDate || !data.endDate) {
          return false;
        }
        const start = new Date(data.startDate);
        const end = new Date(data.endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          return false;
        }
        return end > start;
      }
      return true;
    },
    {
      message:
        "For custom period, valid startDate and endDate are required, and endDate must be after startDate",
      path: ["startDate"],
    }
  );

export type AnalyticsQueryInput = z.infer<typeof analyticsQuerySchema>;

