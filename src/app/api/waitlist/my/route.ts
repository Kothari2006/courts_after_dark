import { NextResponse } from "next/server";
import { validateApiAuth } from "@/lib/auth-utils";
import { getUserWaitlistEntries } from "@/services/fairness.service";

export async function GET() {
  try {
    const authResult = await validateApiAuth();
    if ("response" in authResult) {
      return authResult.response;
    }
    const { user } = authResult;

    const entries = await getUserWaitlistEntries(user.id);

    return NextResponse.json({
      status: "success",
      entries,
    });
  } catch (error) {
    console.error("Error retrieving user waitlist:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to retrieve waitlist entries" },
      { status: 500 }
    );
  }
}

