import { NextRequest, NextResponse } from "next/server";
import { validateApiAuth } from "@/lib/auth-utils";
import { adminUpdateBookingStatusSchema } from "@/lib/validations/booking";
import { updateBookingStatusByAdmin } from "@/services/booking.service";
import mongoose from "mongoose";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await validateApiAuth(["ADMIN"]);
    if ("response" in authResult) {
      return authResult.response;
    }

    const { id } = await params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { status: "error", message: "Invalid booking ID format" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parseResult = adminUpdateBookingStatusSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          status: "error",
          message: "Validation failed",
          errors: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    const updatedBooking = await updateBookingStatusByAdmin({
      bookingId: id,
      status: parseResult.data.status,
      reason: parseResult.data.reason,
      adminId: authResult.user.id,
    });

    return NextResponse.json({
      status: "success",
      message: `Booking status updated to ${parseResult.data.status}`,
      booking: updatedBooking,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";

    if (msg === "BOOKING_NOT_FOUND") {
      return NextResponse.json(
        { status: "error", message: "Booking not found" },
        { status: 404 }
      );
    }

    if (msg === "INVALID_BOOKING_ID" || msg === "INVALID_ADMIN_ID") {
      return NextResponse.json(
        { status: "error", message: "Invalid ID parameter" },
        { status: 400 }
      );
    }

    if (
      msg === "CANCELLATION_REASON_REQUIRED" ||
      msg === "CANNOT_MODIFY_CANCELLED" ||
      msg === "CANNOT_MODIFY_REJECTED" ||
      msg === "CANNOT_MODIFY_COMPLETED" ||
      msg === "INVALID_STATUS_TRANSITION"
    ) {
      return NextResponse.json(
        {
          status: "error",
          message:
            msg === "CANCELLATION_REASON_REQUIRED"
              ? "A cancellation reason of at least 3 characters is required"
              : msg === "CANNOT_MODIFY_CANCELLED"
              ? "Cannot modify an already cancelled booking"
              : msg === "CANNOT_MODIFY_REJECTED"
              ? "Cannot modify an already rejected booking"
              : msg === "CANNOT_MODIFY_COMPLETED"
              ? "Cannot modify an already completed booking"
              : "Invalid status transition",
        },
        { status: 400 }
      );
    }

    if (
      msg === "SLOT_ALREADY_BOOKED" ||
      msg === "FACILITY_UNDER_MAINTENANCE" ||
      msg === "FACILITY_NOT_ACTIVE"
    ) {
      return NextResponse.json(
        {
          status: "error",
          message:
            msg === "SLOT_ALREADY_BOOKED"
              ? "This slot has already been booked by another reservation"
              : msg === "FACILITY_UNDER_MAINTENANCE"
              ? "This facility is currently scheduled for maintenance during the requested slot"
              : "Facility is not active for bookings",
        },
        { status: 409 }
      );
    }

    console.error("Admin booking status update error:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to update booking status" },
      { status: 500 }
    );
  }
}

