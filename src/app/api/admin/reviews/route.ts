import { NextRequest, NextResponse } from "next/server";
import { publicErrorMessage } from "@/lib/api-errors";
import { validateApiAuth } from "@/lib/auth-utils";
import { reviewQuerySchema } from "@/lib/validations/review";
import { getAdminReviews } from "@/services/review.service";

// GET /api/admin/reviews - Admin reviews listing with metrics & filters
export async function GET(req: NextRequest) {
  try {
    const authResult = await validateApiAuth(["ADMIN"]);
    if ("response" in authResult) {
      return authResult.response;
    }

    const { searchParams } = new URL(req.url);
    const parsed = reviewQuerySchema.safeParse({
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || 20,
      status: searchParams.get("status") || "ALL",
      facilityId: searchParams.get("facilityId") || undefined,
      search: searchParams.get("search") || undefined,
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

    const result = await getAdminReviews(parsed.data);

    return NextResponse.json({
      status: "success",
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ status: "error", message: publicErrorMessage(message) }, { status: 500 });
  }
}

