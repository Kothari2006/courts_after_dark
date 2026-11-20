import { NextRequest, NextResponse } from "next/server";
import { publicErrorMessage } from "@/lib/api-errors";
import { validateApiAuth } from "@/lib/auth-utils";
import { updateMaintenanceSchema } from "@/lib/validations/maintenance";
import {
  getMaintenanceById,
  updateMaintenance,
  BookingConflictError,
} from "@/services/maintenance.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/maintenance/[id] - Retrieve maintenance record details (Admin only)
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await validateApiAuth(["ADMIN"]);
    if ("response" in authResult) {
      return authResult.response;
    }

    const { id } = await params;
    const maintenance = await getMaintenanceById(id);

    return NextResponse.json({
      status: "success",
      maintenance,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    if (message === "MAINTENANCE_NOT_FOUND") {
      return NextResponse.json(
        { status: "error", message: "Maintenance record not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ status: "error", message: publicErrorMessage(message) }, { status: 500 });
  }
}

// PATCH /api/maintenance/[id] - Update maintenance schedule (Admin only)
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await validateApiAuth(["ADMIN"]);
    if ("response" in authResult) {
      return authResult.response;
    }
    const { user } = authResult;

    const { id } = await params;
    const body = await req.json();
    const parseResult = updateMaintenanceSchema.safeParse(body);

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

    const updated = await updateMaintenance(id, parseResult.data, user.id);

    return NextResponse.json({
      status: "success",
      message: "Maintenance schedule updated successfully",
      maintenance: updated,
    });
  } catch (error) {
    if (error instanceof BookingConflictError) {
      return NextResponse.json(
        {
          status: "error",
          code: "BOOKING_CONFLICT",
          message:
            "Updated time interval overlaps confirmed student bookings. Resolve booking conflicts before rescheduling.",
          conflictingBookings: error.conflictingBookings,
        },
        { status: 409 }
      );
    }

    const message = error instanceof Error ? error.message : "Internal server error";

    switch (message) {
      case "MAINTENANCE_NOT_FOUND":
        return NextResponse.json(
          { status: "error", message: "Maintenance record not found" },
          { status: 404 }
        );
      case "CANNOT_MODIFY_TERMINAL_MAINTENANCE":
        return NextResponse.json(
          {
            status: "error",
            message: "Cannot modify completed or cancelled maintenance records",
          },
          { status: 400 }
        );
      case "MAINTENANCE_OVERLAP":
        return NextResponse.json(
          {
            status: "error",
            code: "MAINTENANCE_OVERLAP",
            message:
              "Updated schedule overlaps another active maintenance period for this facility.",
          },
          { status: 409 }
        );
      case "INVALID_TIME_RANGE":
        return NextResponse.json(
          { status: "error", message: "End time must be strictly after start time" },
          { status: 400 }
        );
      default:
        return NextResponse.json({ status: "error", message: publicErrorMessage(message) }, { status: 500 });
    }
  }
}

