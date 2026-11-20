import { NextRequest, NextResponse } from "next/server";
import { publicErrorMessage } from "@/lib/api-errors";
import { validateApiAuth } from "@/lib/auth-utils";
import { registerForEventSchema } from "@/lib/validations/event";
import {
  registerForEvent,
  cancelRegistration,
  EventCapacityError,
  DuplicateRegistrationError,
  EventConflictError,
  EventNotFoundError,
} from "@/services/event.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// POST /api/events/[id]/register - Register for event
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const authResult = await validateApiAuth(["STUDENT", "TEACHER", "ADMIN"]);
    if ("response" in authResult) {
      return authResult.response;
    }
    const { user } = authResult;
    const { id } = await context.params;

    let parsedBody = {};
    try {
      const body = await req.json();
      const parsed = registerForEventSchema.safeParse(body);
      if (parsed.success) parsedBody = parsed.data;
    } catch {
      // Body is optional for individual registration
    }

    const registration = await registerForEvent(id, user.id, parsedBody);

    return NextResponse.json(
      {
        status: "success",
        message: "Successfully registered for event",
        registration,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof DuplicateRegistrationError) {
      return NextResponse.json(
        { status: "error", message: error.message },
        { status: 409 }
      );
    }
    if (error instanceof EventCapacityError) {
      return NextResponse.json(
        { status: "error", message: error.message },
        { status: 409 }
      );
    }
    if (error instanceof EventConflictError) {
      return NextResponse.json(
        { status: "error", message: error.message },
        { status: 400 }
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

// DELETE /api/events/[id]/register - Cancel registration
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const authResult = await validateApiAuth(["STUDENT", "TEACHER", "ADMIN"]);
    if ("response" in authResult) {
      return authResult.response;
    }
    const { user } = authResult;
    const { id } = await context.params;

    const cancelled = await cancelRegistration(id, user.id);

    return NextResponse.json({
      status: "success",
      message: "Registration cancelled successfully",
      registration: cancelled,
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
