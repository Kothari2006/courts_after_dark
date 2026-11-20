import { NextResponse } from "next/server";
import { publicErrorMessage } from "@/lib/api-errors";
import { validateApiAuth } from "@/lib/auth-utils";
import { getStudentCheckouts } from "@/services/equipment.service";

// GET /api/equipment/my - Retrieve logged in student's equipment requests & checkouts
export async function GET() {
  try {
    const authResult = await validateApiAuth();
    if ("response" in authResult) {
      return authResult.response;
    }
    const { user } = authResult;

    const checkouts = await getStudentCheckouts(user.id);

    return NextResponse.json({
      status: "success",
      checkouts,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ status: "error", message: publicErrorMessage(message) }, { status: 500 });
  }
}

