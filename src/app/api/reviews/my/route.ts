import { NextRequest, NextResponse } from "next/server";
import { publicErrorMessage } from "@/lib/api-errors";
import { validateApiAuth } from "@/lib/auth-utils";
import { getUserReviews } from "@/services/review.service";

// GET /api/reviews/my - Retrieve authenticated user's submitted reviews
export async function GET(req: NextRequest) {
  try {
    const authResult = await validateApiAuth(["STUDENT", "TEACHER", "ADMIN"]);
    if ("response" in authResult) {
      return authResult.response;
    }
    const { user } = authResult;

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const result = await getUserReviews(
      user.id,
      isNaN(page) ? 1 : page,
      isNaN(limit) ? 20 : limit
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

