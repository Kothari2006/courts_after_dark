import { NextRequest, NextResponse } from "next/server";
import { publicErrorMessage } from "@/lib/api-errors";
import { validateApiAuth } from "@/lib/auth-utils";
import { completeMaintenanceSchema } from "@/lib/validations/maintenance";
import { completeMaintenance } from "@/services/maintenance.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/maintenance/[id]/complete - Complete maintenance schedule (Admin only)
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await validateApiAuth(["ADMIN"]);
    if ("response" in authResult) {
      return authResult.response;
    }
    const { user } = authResult;

    const { id } = await params;

    let notes = "";
    try {
      const body = await req.json();
      const parseResult = completeMaintenanceSchema.safeParse(body);
      if (parseResult.success) {
        notes = parseResult.data.notes;
      }
    } catch {
      // Empty body is acceptable
    }

    const maintenance = await completeMaintenance(id, user.id, notes);

    return NextResponse.json({
      status: "success",
      message: "Maintenance marked as completed successfully",
      maintenance,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";

    switch (message) {
      case "MAINTENANCE_NOT_FOUND":
        return NextResponse.json(
          { status: "error", message: "Maintenance record not found" },
          { status: 404 }
        );
      case "ALREADY_COMPLETED":
        return NextResponse.json(
          { status: "error", message: "This maintenance schedule is already completed" },
          { status: 400 }
        );
      case "CANNOT_COMPLETE_CANCELLED":
        return NextResponse.json(
          { status: "error", message: "Cannot complete a cancelled maintenance schedule" },
          { status: 400 }
        );
      default:
        return NextResponse.json({ status: "error", message: publicErrorMessage(message) }, { status: 500 });
    }
  }
}

