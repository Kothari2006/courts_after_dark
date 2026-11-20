import { NextRequest, NextResponse } from "next/server";
import { validateApiAuth } from "@/lib/auth-utils";
import { cancelBookingSchema } from "@/lib/validations/booking";
import { cancelBooking } from "@/services/booking.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await validateApiAuth();
    if ("response" in authResult) {
      return authResult.response;
    }
    const { user } = authResult;
    const { id } = await params;

    let reason: string | undefined;
    try {
      const body = await req.json();
      const parseResult = cancelBookingSchema.safeParse(body);
      if (parseResult.success) {
        reason = parseResult.data.reason;
      }
    } catch {
      // Body is optional
    }

    const cancelledBooking = await cancelBooking({
      bookingId: id,
      userId: user.id,
      isAdmin: user.role === "ADMIN",
      reason,
    });

    return NextResponse.json({
      status: "success",
      message: "Booking cancelled successfully",
      booking: cancelledBooking,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";

    switch (msg) {
      case "BOOKING_NOT_FOUND":
      case "INVALID_BOOKING_ID":
        return NextResponse.json(
          { status: "error", message: "Booking reservation not found" },
          { status: 404 }
        );
      case "FORBIDDEN":
        return NextResponse.json(
          { status: "error", message: "You are not authorized to cancel this booking" },
          { status: 403 }
        );
      case "CANNOT_CANCEL_COMPLETED":
        return NextResponse.json(
          { status: "error", message: "Completed bookings cannot be cancelled" },
          { status: 400 }
        );
      case "ALREADY_CANCELLED":
        return NextResponse.json(
          { status: "error", message: "This booking has already been cancelled" },
          { status: 400 }
        );
      case "CANNOT_CANCEL_REJECTED":
        return NextResponse.json(
          { status: "error", message: "Rejected bookings cannot be cancelled" },
          { status: 400 }
        );
      case "CANCELLATION_DEADLINE_EXCEEDED":
        return NextResponse.json(
          {
            status: "error",
            message: "Late cancellation policy: Bookings must be cancelled at least 2 hours before the start time.",
          },
          { status: 400 }
        );
      default:
        console.error("Cancellation error:", error);
        return NextResponse.json(
          { status: "error", message: "Failed to process booking cancellation" },
          { status: 500 }
        );
    }
  }
}

