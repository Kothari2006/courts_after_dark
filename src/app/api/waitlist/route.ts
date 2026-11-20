import { NextRequest, NextResponse } from "next/server";
import { validateApiAuth } from "@/lib/auth-utils";
import { joinWaitlistSchema } from "@/lib/validations/waitlist";
import { joinWaitlist } from "@/services/fairness.service";

export async function POST(req: NextRequest) {
  try {
    const authResult = await validateApiAuth();
    if ("response" in authResult) {
      return authResult.response;
    }
    const { user } = authResult;

    const body = await req.json();
    const parseResult = joinWaitlistSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          status: "error",
          message: "Validation failed",
          errors: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { facilityId, startAt, endAt } = parseResult.data;

    const waitlistEntry = await joinWaitlist({
      facilityId,
      startAt,
      endAt,
      userId: user.id,
    });

    return NextResponse.json(
      {
        status: "success",
        message: `Successfully joined waiting list (Position #${waitlistEntry.position})`,
        waitlistEntry,
      },
      { status: 201 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";

    switch (msg) {
      case "ALREADY_ON_WAITLIST":
        return NextResponse.json(
          {
            status: "error",
            message: "You are already active on the waiting list for this court slot.",
          },
          { status: 409 }
        );
      case "WAITLIST_DISABLED":
        return NextResponse.json(
          {
            status: "error",
            message: "Waiting list queue is currently disabled under campus fair-play policies.",
          },
          { status: 400 }
        );
      case "CANNOT_WAITLIST_PAST":
        return NextResponse.json(
          { status: "error", message: "Cannot join waiting list for past time slots." },
          { status: 400 }
        );
      case "FACILITY_NOT_FOUND":
        return NextResponse.json(
          { status: "error", message: "Facility not found." },
          { status: 404 }
        );
      case "FACILITY_NOT_ACTIVE":
        return NextResponse.json(
          { status: "error", message: "Facility is not active for bookings." },
          { status: 400 }
        );
      default:
        console.error("Join waitlist error:", error);
        return NextResponse.json(
          { status: "error", message: "Failed to join waiting list." },
          { status: 500 }
        );
    }
  }
}

