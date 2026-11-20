import { NextRequest, NextResponse } from "next/server";
import { publicErrorMessage } from "@/lib/api-errors";
import { validateApiAuth } from "@/lib/auth-utils";
import {
  createMaintenanceReportSchema,
  maintenanceReportQuerySchema,
} from "@/lib/validations/maintenance-report";
import {
  createTeacherMaintenanceReport,
  getTeacherMaintenanceReports,
} from "@/services/teacher.service";

// GET /api/teacher/reports - List damage/maintenance reports submitted by logged-in teacher
export async function GET(req: NextRequest) {
  try {
    const authResult = await validateApiAuth(["TEACHER", "ADMIN"]);
    if ("response" in authResult) {
      return authResult.response;
    }
    const { user } = authResult;

    const { searchParams } = new URL(req.url);
    const parsed = maintenanceReportQuerySchema.safeParse({
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || 20,
      status: searchParams.get("status") || "ALL",
      type: searchParams.get("type") || "ALL",
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          status: "error",
          message: "Invalid query parameters",
          errors: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const result = await getTeacherMaintenanceReports(user.id, parsed.data);

    return NextResponse.json({
      status: "success",
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ status: "error", message: publicErrorMessage(message) }, { status: 500 });
  }
}

// POST /api/teacher/reports - Submit facility or equipment damage report
export async function POST(req: NextRequest) {
  try {
    const authResult = await validateApiAuth(["TEACHER", "ADMIN"]);
    if ("response" in authResult) {
      return authResult.response;
    }
    const { user } = authResult;

    const body = await req.json();
    const parsed = createMaintenanceReportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          status: "error",
          message: "Validation failed",
          errors: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const report = await createTeacherMaintenanceReport(parsed.data, user.id);

    return NextResponse.json(
      {
        status: "success",
        message: "Damage report submitted successfully to administrators",
        report,
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ status: "error", message: publicErrorMessage(message) }, { status: 500 });
  }
}

