import { NextRequest, NextResponse } from "next/server";
import { validateApiAuth } from "@/lib/auth-utils";
import { getNoShowHistory } from "@/services/fairness.service";

export async function GET(req: NextRequest) {
  try {
    const authResult = await validateApiAuth(["ADMIN"]);
    if ("response" in authResult) {
      return authResult.response;
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const history = await getNoShowHistory({ page, limit });

    return NextResponse.json({
      status: "success",
      ...history,
    });
  } catch (error) {
    console.error("Error retrieving no-show history:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to retrieve no-show history" },
      { status: 500 }
    );
  }
}

