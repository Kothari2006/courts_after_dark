import { NextRequest, NextResponse } from "next/server";
import { validateApiAuth } from "@/lib/auth-utils";
import { getAdminBookingDetails } from "@/services/booking.service";
import mongoose from "mongoose";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
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

    const details = await getAdminBookingDetails(id);

    return NextResponse.json({
      status: "success",
      ...details,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message === "BOOKING_NOT_FOUND") {
      return NextResponse.json(
        { status: "error", message: "Booking not found" },
        { status: 404 }
      );
    }
    if (message === "INVALID_BOOKING_ID") {
      return NextResponse.json(
        { status: "error", message: "Invalid booking ID" },
        { status: 400 }
      );
    }

    console.error("Admin booking details query error:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to retrieve booking details" },
      { status: 500 }
    );
  }
}

