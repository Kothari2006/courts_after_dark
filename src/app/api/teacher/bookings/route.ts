import { NextRequest, NextResponse } from "next/server";
import { publicErrorMessage } from "@/lib/api-errors";
import { validateApiAuth } from "@/lib/auth-utils";
import { getStudentBookingsForTeacher } from "@/services/teacher.service";

// GET /api/teacher/bookings - View student bookings (read-only for teachers)
export async function GET(req: NextRequest) {
  try {
    const authResult = await validateApiAuth(["TEACHER", "ADMIN"]);
    if ("response" in authResult) {
      return authResult.response;
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const search = searchParams.get("search") || undefined;
    const facilityId = searchParams.get("facilityId") || undefined;
    const sportType = searchParams.get("sportType") || undefined;
    const date = searchParams.get("date") || undefined;
    const status = searchParams.get("status") || "ALL";

    const result = await getStudentBookingsForTeacher({
      page: isNaN(page) ? 1 : page,
      limit: isNaN(limit) ? 20 : limit,
      search,
      facilityId,
      sportType,
      date,
      status,
    });

    return NextResponse.json({
      status: "success",
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ status: "error", message: publicErrorMessage(message) }, { status: 500 });
  }
}

