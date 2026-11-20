import { NextRequest, NextResponse } from "next/server";
import { publicErrorMessage } from "@/lib/api-errors";
import { validateApiAuth } from "@/lib/auth-utils";
import { cancelMaintenanceSchema } from "@/lib/validations/maintenance";
import { cancelMaintenance } from "@/services/maintenance.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/maintenance/[id]/cancel - Cancel maintenance schedule (Admin only)
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await validateApiAuth(["ADMIN"]);
    if ("response" in authResult) {
      return authResult.response;
    }
    const { user } = authResult;

    const { id } = await params;

    let reason = "";
    try {
      const body = await req.json();
      const parseResult = cancelMaintenanceSchema.safeParse(body);
      if (parseResult.success) {
        reason = parseResult.data.reason;
      }
    } catch {
      // Empty body is acceptable
    }

    const maintenance = await cancelMaintenance(id, user.id, reason);

    return NextResponse.json({
      status: "success",
      message: "Maintenance schedule cancelled successfully",
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
      case "ALREADY_CANCELLED":
        return NextResponse.json(
          { status: "error", message: "This maintenance schedule is already cancelled" },
          { status: 400 }
        );
      case "CANNOT_CANCEL_COMPLETED":
        return NextResponse.json(
          { status: "error", message: "Cannot cancel already completed maintenance" },
          { status: 400 }
        );
      default:
        return NextResponse.json({ status: "error", message: publicErrorMessage(message) }, { status: 500 });
    }
  }
}

