import { NextRequest, NextResponse } from "next/server";
import { publicErrorMessage } from "@/lib/api-errors";
import { validateApiAuth } from "@/lib/auth-utils";
import { adminModerateReviewSchema } from "@/lib/validations/review";
import {
  moderateReview,
  ReviewNotFoundError,
} from "@/services/review.service";
import mongoose from "mongoose";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// PATCH /api/admin/reviews/[id]/moderate - Approve or reject review with reason & audit tracking
export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const authResult = await validateApiAuth(["ADMIN"]);
    if ("response" in authResult) {
      return authResult.response;
    }
    const { user } = authResult;
    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { status: "error", message: "Invalid review ID format" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parsed = adminModerateReviewSchema.safeParse(body);

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

    const updatedReview = await moderateReview(
      id,
      parsed.data.status,
      parsed.data.reason,
      user.id
    );

    return NextResponse.json({
      status: "success",
      message: `Review successfully ${parsed.data.status.toLowerCase()}`,
      review: updatedReview,
    });
  } catch (error) {
    if (error instanceof ReviewNotFoundError) {
      return NextResponse.json(
        { status: "error", message: error.message },
        { status: 404 }
      );
    }
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ status: "error", message: publicErrorMessage(message) }, { status: 500 });
  }
}

