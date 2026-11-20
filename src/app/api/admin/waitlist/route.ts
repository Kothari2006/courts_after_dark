import { NextRequest, NextResponse } from "next/server";
import { validateApiAuth } from "@/lib/auth-utils";
import connectToDatabase from "@/lib/mongodb";
import Waitlist from "@/models/Waitlist";

export async function GET(req: NextRequest) {
  try {
    const authResult = await validateApiAuth(["ADMIN"]);
    if ("response" in authResult) {
      return authResult.response;
    }

    const { searchParams } = new URL(req.url);
    const facilityId = searchParams.get("facilityId");
    const status = searchParams.get("status") || "WAITING";

    await connectToDatabase();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};
    if (facilityId) query.facility = facilityId;
    if (status !== "ALL") query.status = status;

    const entries = await Waitlist.find(query)
      .populate("user", "name email phoneNumber")
      .populate("facility", "name sportType location")
      .sort({ createdAt: -1, position: 1 })
      .limit(100)
      .lean();

    return NextResponse.json({
      status: "success",
      entries,
    });
  } catch (error) {
    console.error("Error retrieving admin waitlist:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to retrieve waitlist entries" },
      { status: 500 }
    );
  }
}

