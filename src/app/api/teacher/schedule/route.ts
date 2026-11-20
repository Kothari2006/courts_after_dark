import { NextRequest, NextResponse } from "next/server";
import { publicErrorMessage } from "@/lib/api-errors";
import { validateApiAuth } from "@/lib/auth-utils";
import { getFacilityScheduleForTeacher } from "@/services/teacher.service";

// GET /api/teacher/schedule - View facility schedule & availability (privacy-safe)
export async function GET(req: NextRequest) {
  try {
    const authResult = await validateApiAuth(["TEACHER", "ADMIN"]);
    if ("response" in authResult) {
      return authResult.response;
    }

    const { searchParams } = new URL(req.url);
    const facilityId = searchParams.get("facilityId");
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

    if (!facilityId) {
      return NextResponse.json(
        { status: "error", message: "facilityId is required" },
        { status: 400 }
      );
    }

    const schedule = await getFacilityScheduleForTeacher(facilityId, date);

    return NextResponse.json({
      status: "success",
      schedule,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ status: "error", message: publicErrorMessage(message) }, { status: 500 });
  }
}

