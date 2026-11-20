import { NextRequest, NextResponse } from "next/server";
import { publicErrorMessage } from "@/lib/api-errors";
import { validateApiAuth } from "@/lib/auth-utils";
import { updateEventSchema } from "@/lib/validations/event";
import {
  getEventById,
  updateEvent,
  EventConflictError,
  EventForbiddenError,
  EventNotFoundError,
} from "@/services/event.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/events/[id] - Get event details
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const authResult = await validateApiAuth(["STUDENT", "TEACHER", "ADMIN"]);
    if ("response" in authResult) {
      return authResult.response;
    }

    const { id } = await context.params;
    const event = await getEventById(id);

    return NextResponse.json({
      status: "success",
      event,
    });
  } catch (error) {
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

// PATCH /api/events/[id] - Update event details (Organizer Teacher or Admin)
export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const authResult = await validateApiAuth(["TEACHER", "ADMIN"]);
    if ("response" in authResult) {
      return authResult.response;
    }
    const { user } = authResult;
    const { id } = await context.params;

    const body = await req.json();
    const parsed = updateEventSchema.safeParse(body);

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

    const updated = await updateEvent(
      id,
      parsed.data,
      user.id,
      user.role === "ADMIN"
    );

    return NextResponse.json({
      status: "success",
      message: "Event updated successfully",
      event: updated,
    });
  } catch (error) {
    if (error instanceof EventForbiddenError) {
      return NextResponse.json(
        { status: "error", message: error.message },
        { status: 403 }
      );
    }
    if (error instanceof EventConflictError) {
      return NextResponse.json(
        { status: "error", message: error.message },
        { status: 409 }
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
