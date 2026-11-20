import { NextRequest, NextResponse } from "next/server";
import { validateApiAuth } from "@/lib/auth-utils";
import { reportQuerySchema } from "@/lib/validations/report";
import { getMaintenanceReport } from "@/services/report.service";
import { createCsvResponse } from "@/lib/csv-helper";

export async function GET(req: NextRequest) {
  try {
    const authResult = await validateApiAuth(["ADMIN"]);
    if ("response" in authResult) {
      return authResult.response;
    }

    const { searchParams } = new URL(req.url);
    const rawParams = {
      period: searchParams.get("period") ?? undefined,
      startDate: searchParams.get("startDate") ?? undefined,
      endDate: searchParams.get("endDate") ?? undefined,
      format: searchParams.get("format") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      facilityId: searchParams.get("facilityId") ?? undefined,
    };

    const parseResult = reportQuerySchema.safeParse(rawParams);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          status: "error",
          message: "Invalid query parameters",
          errors: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    const report = await getMaintenanceReport(parseResult.data);

    if (report.format === "csv") {
      return createCsvResponse(report.csvContent, report.filename);
    }

    return NextResponse.json({
      status: "success",
      ...report,
    });
  } catch (error) {
    console.error("Maintenance report error:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to generate maintenance report" },
      { status: 500 }
    );
  }
}

