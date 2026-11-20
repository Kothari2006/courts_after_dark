import { NextRequest, NextResponse } from "next/server";
import { validateApiAuth } from "@/lib/auth-utils";
import { leaveWaitlist } from "@/services/fairness.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await validateApiAuth();
    if ("response" in authResult) {
      return authResult.response;
    }
    const { user } = authResult;
    const { id } = await params;

    const cancelledEntry = await leaveWaitlist({
      waitlistId: id,
      userId: user.id,
      isAdmin: user.role === "ADMIN",
    });

    return NextResponse.json({
      status: "success",
      message: "Successfully removed from waiting list",
      entry: cancelledEntry,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";

    switch (msg) {
      case "WAITLIST_ENTRY_NOT_FOUND":
      case "INVALID_WAITLIST_ID":
        return NextResponse.json(
          { status: "error", message: "Waitlist entry not found" },
          { status: 404 }
        );
      case "FORBIDDEN":
        return NextResponse.json(
          { status: "error", message: "You are not authorized to cancel this waitlist entry" },
          { status: 403 }
        );
      default:
        console.error("Leave waitlist error:", error);
        return NextResponse.json(
          { status: "error", message: "Failed to leave waiting list" },
          { status: 500 }
        );
    }
  }
}

