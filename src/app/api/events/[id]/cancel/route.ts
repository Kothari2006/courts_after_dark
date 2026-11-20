import { NextRequest, NextResponse } from "next/server";
import { publicErrorMessage } from "@/lib/api-errors";
import { validateApiAuth } from "@/lib/auth-utils";
import { cancelEventSchema } from "@/lib/validations/event";
import {
  cancelEvent,
  EventForbiddenError,
  EventNotFoundError,
} from "@/services/event.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// POST /api/events/[id]/cancel - Cancel event
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const authResult = await validateApiAuth(["TEACHER", "ADMIN"]);
    if ("response" in authResult) {
      return authResult.response;
    }
    const { user } = authResult;
    const { id } = await context.params;

    const body = await req.json();
    const parsed = cancelEventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          status: "error",
          message: "Validation failed",
          errors: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const cancelled = await cancelEvent(
      id,
      parsed.data.reason,
      user.id,
      user.role === "ADMIN"
    );

    return NextResponse.json({
      status: "success",
      message: "Event cancelled successfully",
      event: cancelled,
    });
  } catch (error) {
    if (error instanceof EventForbiddenError) {
      return NextResponse.json(
        { status: "error", message: error.message },
        { status: 403 }
      );
    }
    if (error instanceof EventNotFoundError) {
      return NextResponse.json(
        { status: "error", message: error.message },
        { status: 404 }
      );
    }
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ status: "error", message: publicErrorMessage(message) }, { status: 500 });
  }
}
