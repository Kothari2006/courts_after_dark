import { NextRequest, NextResponse } from "next/server";
import { publicErrorMessage } from "@/lib/api-errors";
import { validateApiAuth } from "@/lib/auth-utils";
import { createReviewSchema } from "@/lib/validations/review";
import {
  createReview,
  ReviewEligibilityError,
  DuplicateReviewError,
} from "@/services/review.service";

// POST /api/reviews - Submit review for completed booking
export async function POST(req: NextRequest) {
  try {
    const authResult = await validateApiAuth(["STUDENT", "TEACHER", "ADMIN"]);
    if ("response" in authResult) {
      return authResult.response;
    }
    const { user } = authResult;

    const body = await req.json();
    const parsed = createReviewSchema.safeParse(body);

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

    const review = await createReview(parsed.data, user.id);

    return NextResponse.json(
      {
        status: "success",
        message: "Your review has been submitted and is pending administrative approval",
        review,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof DuplicateReviewError) {
      return NextResponse.json(
        { status: "error", message: error.message },
        { status: 409 }
      );
    }
    if (error instanceof ReviewEligibilityError) {
      return NextResponse.json(
        { status: "error", message: error.message },
        { status: 403 }
      );
    }
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ status: "error", message: publicErrorMessage(message) }, { status: 500 });
  }
}

