import { NextRequest, NextResponse } from "next/server";
import { validateApiAuth } from "@/lib/auth-utils";
import { recordAttendanceSchema } from "@/lib/validations/attendance";
import { recordAttendance } from "@/services/fairness.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await validateApiAuth(["TEACHER", "ADMIN"]);
    if ("response" in authResult) {
      return authResult.response;
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = recordAttendanceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { status: "error", message: "Validation failed", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const booking = await recordAttendance({
      bookingId: id,
      attendanceStatus: parsed.data.attendanceStatus,
      adminId: authResult.user.id,
    });

    return NextResponse.json({
      status: "success",
      message: `Reservation marked as ${parsed.data.attendanceStatus}`,
      booking,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message === "BOOKING_NOT_FOUND" || message === "INVALID_BOOKING_ID") {
      return NextResponse.json(
        { status: "error", message: "Booking reservation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { status: "error", message: "Failed to update attendance status" },
      { status: 500 }
    );
  }
}
