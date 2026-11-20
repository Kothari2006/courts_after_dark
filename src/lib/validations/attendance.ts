import { z } from "zod";

export const recordAttendanceSchema = z.object({
  attendanceStatus: z.enum(["PENDING", "CHECKED_IN", "NO_SHOW"], {
    message: "Invalid attendance status",
  }),
});

export type RecordAttendanceInput = z.infer<typeof recordAttendanceSchema>;

