import { NextResponse } from "next/server";
import { publicErrorMessage } from "@/lib/api-errors";
import { validateApiAuth } from "@/lib/auth-utils";
import { getTeacherOverviewStats } from "@/services/teacher.service";

// GET /api/teacher/stats - Overview metrics for teacher dashboard
export async function GET() {
  try {
    const authResult = await validateApiAuth(["TEACHER", "ADMIN"]);
    if ("response" in authResult) {
      return authResult.response;
    }
    const { user } = authResult;

    const stats = await getTeacherOverviewStats(user.id);

    return NextResponse.json({
      status: "success",
      stats,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ status: "error", message: publicErrorMessage(message) }, { status: 500 });
  }
}

