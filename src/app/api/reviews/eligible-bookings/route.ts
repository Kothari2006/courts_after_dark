import { NextResponse } from "next/server";
import { publicErrorMessage } from "@/lib/api-errors";
import { validateApiAuth } from "@/lib/auth-utils";
import { getEligibleBookingsForReview } from "@/services/review.service";

// GET /api/reviews/eligible-bookings - Retrieve completed unreviewed bookings for the user
export async function GET() {
  try {
    const authResult = await validateApiAuth(["STUDENT", "TEACHER", "ADMIN"]);
    if ("response" in authResult) {
      return authResult.response;
    }
    const { user } = authResult;

    const eligibleBookings = await getEligibleBookingsForReview(user.id);

    return NextResponse.json({
      status: "success",
      eligibleBookings,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ status: "error", message: publicErrorMessage(message) }, { status: 500 });
  }
}

