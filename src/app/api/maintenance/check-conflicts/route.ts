import { NextRequest, NextResponse } from "next/server";
import { publicErrorMessage } from "@/lib/api-errors";
import { validateApiAuth } from "@/lib/auth-utils";
import { checkConflictsSchema } from "@/lib/validations/maintenance";
import { checkMaintenanceConflicts } from "@/services/maintenance.service";

// POST /api/maintenance/check-conflicts - Check maintenance or booking conflicts (Admin only)
export async function POST(req: NextRequest) {
  try {
    const authResult = await validateApiAuth(["ADMIN"]);
    if ("response" in authResult) {
      return authResult.response;
    }

    const body = await req.json();
    const parseResult = checkConflictsSchema.safeParse(body);

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

    const { facilityId, startAt, endAt, excludeMaintenanceId } = parseResult.data;

    const result = await checkMaintenanceConflicts(
      facilityId,
      startAt,
      endAt,
      excludeMaintenanceId
    );

    return NextResponse.json({
      status: "success",
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ status: "error", message: publicErrorMessage(message) }, { status: 500 });
  }
}

