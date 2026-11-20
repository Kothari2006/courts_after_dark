import { NextResponse } from "next/server";
import { publicErrorMessage } from "@/lib/api-errors";
import { validateApiAuth } from "@/lib/auth-utils";
import { getOverdueCheckouts } from "@/services/equipment.service";

// GET /api/equipment/overdue - Retrieve overdue checkouts (Staff only)
export async function GET() {
  try {
    const authResult = await validateApiAuth(["EQUIPMENT_MANAGER", "ADMIN"]);
    if ("response" in authResult) {
      return authResult.response;
    }

    const overdueCheckouts = await getOverdueCheckouts();

    return NextResponse.json({
      status: "success",
      count: overdueCheckouts.length,
      checkouts: overdueCheckouts,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ status: "error", message: publicErrorMessage(message) }, { status: 500 });
  }
}
