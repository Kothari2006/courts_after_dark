import { NextRequest, NextResponse } from "next/server";
import { validateApiAuth } from "@/lib/auth-utils";
import { createBookingSchema } from "@/lib/validations/booking";
import { createBooking } from "@/services/booking.service";

export async function POST(req: NextRequest) {
  try {
    const authResult = await validateApiAuth();
    if ("response" in authResult) {
      return authResult.response;
    }
    const { user } = authResult;

    const body = await req.json();
    const parseResult = createBookingSchema.safeParse(body);

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

    const { facilityId, startAt, endAt } = parseResult.data;

    const booking = await createBooking({
      facilityId,
      startAt,
      endAt,
      userId: user.id,
    });

    return NextResponse.json(
      {
        status: "success",
        message: "Booking confirmed successfully",
        booking,
      },
      { status: 201 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";

    switch (msg) {
      case "CANNOT_BOOK_PAST":
        return NextResponse.json(
          { status: "error", message: "Cannot book time slots in the past" },
          { status: 400 }
        );
      case "EXCEEDS_MAX_DURATION":
        return NextResponse.json(
          { status: "error", message: "Booking duration exceeds maximum allowed limit (60 minutes)" },
          { status: 400 }
        );
      case "EXCEEDS_ADVANCE_WINDOW":
        return NextResponse.json(
          { status: "error", message: "Cannot book more than 7 days in advance" },
          { status: 400 }
        );
      case "OUTSIDE_OPERATING_HOURS":
        return NextResponse.json(
          { status: "error", message: "Requested time slot is outside facility operating hours" },
          { status: 400 }
        );
      case "FACILITY_NOT_FOUND":
        return NextResponse.json(
          { status: "error", message: "Facility not found" },
          { status: 404 }
        );
      case "FACILITY_NOT_ACTIVE":
        return NextResponse.json(
          { status: "error", message: "Facility is currently not active for bookings" },
          { status: 400 }
        );
      case "MAX_ACTIVE_BOOKINGS_EXCEEDED":
        return NextResponse.json(
          {
            status: "error",
            message: "Active booking quota reached (maximum 2 active reservations). Please cancel an existing reservation or wait until a match completes.",
          },
          { status: 409 }
        );
      case "PRIME_TIME_LIMIT_EXCEEDED":
        return NextResponse.json(
          {
            status: "error",
            message: "Fairness Allocation Limit: You may only reserve 1 prime-time court (6 PM - 9 PM) per day to ensure equitable access for all students.",
          },
          { status: 409 }
        );
      case "SLOT_ALREADY_BOOKED":
        return NextResponse.json(
          {
            status: "error",
            message: "This court slot has already been reserved by another student. Please select another time.",
          },
          { status: 409 }
        );
      case "FACILITY_UNDER_MAINTENANCE":
        return NextResponse.json(
          {
            status: "error",
            message: "Court is unavailable due to scheduled maintenance during this time slot.",
          },
          { status: 409 }
        );
      case "INVALID_FACILITY_ID":
      case "INVALID_USER_ID":
      case "INVALID_DATE_FORMAT":
      case "INVALID_TIME_RANGE":
        return NextResponse.json(
          { status: "error", message: msg },
          { status: 400 }
        );
      default:
        console.error("Booking creation error:", error);
        return NextResponse.json(
          { status: "error", message: "Internal server error occurred while processing booking" },
          { status: 500 }
        );
    }
  }
}

