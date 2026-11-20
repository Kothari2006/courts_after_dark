import { NextRequest, NextResponse } from "next/server";
import { calculateFacilityAvailability } from "@/services/availability.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date")?.trim();

    if (!date) {
      return NextResponse.json(
        {
          success: false,
          message: "Query parameter 'date' is required in YYYY-MM-DD format (e.g. ?date=2026-11-15)",
        },
        { status: 400 }
      );
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid date format. Expected YYYY-MM-DD",
        },
        { status: 400 }
      );
    }

    // Validate if the date string is a real calendar date
    const [y, m, d] = date.split("-").map(Number);
    const testDate = new Date(Date.UTC(y, m - 1, d));
    if (
      testDate.getUTCFullYear() !== y ||
      testDate.getUTCMonth() !== m - 1 ||
      testDate.getUTCDate() !== d
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid calendar date specified",
        },
        { status: 400 }
      );
    }

    const availability = await calculateFacilityAvailability(id, date);

    return NextResponse.json(availability, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message === "INVALID_ID") {
      return NextResponse.json(
        { success: false, message: "Invalid facility ID format" },
        { status: 400 }
      );
    }

    if (message === "INVALID_DATE_FORMAT") {
      return NextResponse.json(
        { success: false, message: "Invalid date format" },
        { status: 400 }
      );
    }

    if (message === "FACILITY_NOT_FOUND") {
      return NextResponse.json(
        { success: false, message: "Facility not found" },
        { status: 404 }
      );
    }

    if (message === "FACILITY_INACTIVE") {
      return NextResponse.json(
        {
          success: false,
          message: "Facility is currently inactive and unavailable for booking",
        },
        { status: 404 }
      );
    }

    console.error("GET /api/facilities/[id]/availability error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to compute facility availability",
      },
      { status: 500 }
    );
  }
}

