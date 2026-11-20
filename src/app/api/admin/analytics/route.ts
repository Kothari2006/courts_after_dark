import { NextRequest, NextResponse } from "next/server";
import { validateApiAuth } from "@/lib/auth-utils";
import { analyticsQuerySchema } from "@/lib/validations/analytics";
import { getAdminAnalytics } from "@/services/analytics.service";

// GET /api/admin/analytics - Admin Analytics Dashboard Data
export async function GET(req: NextRequest) {
  try {
    const authResult = await validateApiAuth(["ADMIN"]);
    if ("response" in authResult) {
      return authResult.response;
    }

    const { searchParams } = new URL(req.url);
    const rawPeriod = searchParams.get("period") || "30d";
    const rawStartDate = searchParams.get("startDate") || undefined;
    const rawEndDate = searchParams.get("endDate") || undefined;

    const parseResult = analyticsQuerySchema.safeParse({
      period: rawPeriod,
      startDate: rawStartDate,
      endDate: rawEndDate,
    });

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

    const analytics = await getAdminAnalytics(parseResult.data);

    return NextResponse.json({
      status: "success",
      data: analytics,
      ...analytics,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    const statusCode =
      message === "INVALID_CUSTOM_DATE_RANGE" || message === "INVALID_DATE_RANGE"
        ? 400
        : 500;

    return NextResponse.json({ status: "error", message }, { status: statusCode });
  }
}

