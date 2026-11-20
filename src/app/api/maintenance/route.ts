import { NextRequest, NextResponse } from "next/server";
import { publicErrorMessage } from "@/lib/api-errors";
import { validateApiAuth } from "@/lib/auth-utils";
import { createMaintenanceSchema } from "@/lib/validations/maintenance";
import {
  createMaintenance,
  getMaintenanceSchedules,
  BookingConflictError,
} from "@/services/maintenance.service";
import { MaintenanceStatus } from "@/models/Maintenance";

// GET /api/maintenance - Retrieve maintenance schedules (Admin only)
export async function GET(req: NextRequest) {
  try {
    const authResult = await validateApiAuth(["ADMIN"]);
    if ("response" in authResult) {
      return authResult.response;
    }

    const { searchParams } = new URL(req.url);
    const facilityId = searchParams.get("facilityId") || undefined;
    const status = (searchParams.get("status") as MaintenanceStatus | "ALL") || "ALL";
    const from = searchParams.get("from") || undefined;
    const to = searchParams.get("to") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const result = await getMaintenanceSchedules({
      facilityId,
      status,
      from,
      to,
      page: isNaN(page) ? 1 : page,
      limit: isNaN(limit) ? 20 : limit,
    });

    return NextResponse.json({
      status: "success",
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ status: "error", message: publicErrorMessage(message) }, { status: 500 });
  }
}

// POST /api/maintenance - Schedule maintenance for facility (Admin only)
export async function POST(req: NextRequest) {
  try {
    const authResult = await validateApiAuth(["ADMIN"]);
    if ("response" in authResult) {
      return authResult.response;
    }
    const { user } = authResult;

    const body = await req.json();
    const parseResult = createMaintenanceSchema.safeParse(body);

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

    const { facilityId, startAt, endAt, reason, notes, status } = parseResult.data;

    const maintenance = await createMaintenance({
      facilityId,
      startAt,
      endAt,
      reason,
      notes,
      status,
      adminId: user.id,
    });

    return NextResponse.json(
      {
        status: "success",
        message: "Facility maintenance scheduled successfully",
        maintenance,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof BookingConflictError) {
      return NextResponse.json(
        {
          status: "error",
          code: "BOOKING_CONFLICT",
          message:
            "Cannot schedule maintenance: Confirmed student bookings overlap this time period. Review conflicting bookings before proceeding.",
          conflictingBookings: error.conflictingBookings,
        },
        { status: 409 }
      );
    }

    const message = error instanceof Error ? error.message : "Internal server error";

    switch (message) {
      case "MAINTENANCE_OVERLAP":
        return NextResponse.json(
          {
            status: "error",
            code: "MAINTENANCE_OVERLAP",
            message:
              "An active maintenance schedule already overlaps this time interval for the selected facility.",
          },
          { status: 409 }
        );
      case "FACILITY_NOT_FOUND":
        return NextResponse.json(
          { status: "error", message: "Facility not found" },
          { status: 404 }
        );
      case "INVALID_TIME_RANGE":
        return NextResponse.json(
          { status: "error", message: "End time must be strictly after start time" },
          { status: 400 }
        );
      case "INVALID_DATE_FORMAT":
        return NextResponse.json(
          { status: "error", message: "Invalid date or time format" },
          { status: 400 }
        );
      default:
        return NextResponse.json({ status: "error", message: publicErrorMessage(message) }, { status: 500 });
    }
  }
}

