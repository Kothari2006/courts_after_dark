import { NextRequest, NextResponse } from "next/server";
import { validateApiAuth } from "@/lib/auth-utils";
import { recordAttendanceSchema } from "@/lib/validations/attendance";
import { recordAttendance } from "@/services/fairness.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await validateApiAuth(["ADMIN"]);
    if ("response" in authResult) {
      return authResult.response;
    }
    const { user } = authResult;
    const { id } = await params;

    const body = await req.json();
    const parseResult = recordAttendanceSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          status: "error",
          message: "Validation failed",
          errors: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { attendanceStatus } = parseResult.data;

    const updatedBooking = await recordAttendance({
      bookingId: id,
      attendanceStatus,
      adminId: user.id,
    });

    return NextResponse.json({
      status: "success",
      message: `Reservation marked as ${attendanceStatus}`,
      booking: updatedBooking,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";

    if (msg === "BOOKING_NOT_FOUND" || msg === "INVALID_BOOKING_ID") {
      return NextResponse.json(
        { status: "error", message: "Booking reservation not found" },
        { status: 404 }
      );
    }

    console.error("Attendance update error:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to update attendance status" },
      { status: 500 }
    );
  }
}

