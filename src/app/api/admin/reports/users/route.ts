import { NextRequest, NextResponse } from "next/server";
import { validateApiAuth } from "@/lib/auth-utils";
import { reportQuerySchema } from "@/lib/validations/report";
import { getUserRegistrationReport } from "@/services/report.service";
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
      role: searchParams.get("role") ?? undefined,
      accountStatus: searchParams.get("accountStatus") ?? undefined,
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

    const report = await getUserRegistrationReport(parseResult.data);

    if (report.format === "csv") {
      return createCsvResponse(report.csvContent, report.filename);
    }

    return NextResponse.json({
      status: "success",
      ...report,
    });
  } catch (error) {
    console.error("User registration report error:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to generate user registration report" },
      { status: 500 }
    );
  }
}

