import { NextRequest, NextResponse } from "next/server";
import { validateApiAuth } from "@/lib/auth-utils";
import { getBookingById } from "@/services/booking.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await validateApiAuth();
    if ("response" in authResult) {
      return authResult.response;
    }
    const { user } = authResult;
    const { id } = await params;

    const booking = await getBookingById(id, user.id, user.role === "ADMIN");

    return NextResponse.json({
      status: "success",
      booking,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";

    if (msg === "BOOKING_NOT_FOUND" || msg === "INVALID_BOOKING_ID") {
      return NextResponse.json(
        { status: "error", message: "Booking reservation not found" },
        { status: 404 }
      );
    }

    if (msg === "FORBIDDEN") {
      return NextResponse.json(
        { status: "error", message: "You are not authorized to view this booking" },
        { status: 403 }
      );
    }

    console.error("Error retrieving booking details:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to retrieve booking details" },
      { status: 500 }
    );
  }
}

