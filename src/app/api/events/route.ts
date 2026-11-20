import { NextRequest, NextResponse } from "next/server";
import { publicErrorMessage } from "@/lib/api-errors";
import { validateApiAuth } from "@/lib/auth-utils";
import { createEventSchema, eventQuerySchema } from "@/lib/validations/event";
import {
  createEvent,
  getEvents,
  EventConflictError,
  EventNotFoundError,
} from "@/services/event.service";

// GET /api/events - List events with query filters
export async function GET(req: NextRequest) {
  try {
    const authResult = await validateApiAuth(["STUDENT", "TEACHER", "ADMIN"]);
    if ("response" in authResult) {
      return authResult.response;
    }
    const { user } = authResult;

    const { searchParams } = new URL(req.url);
    const parsed = eventQuerySchema.safeParse({
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || 10,
      search: searchParams.get("search") || undefined,
      sportType: searchParams.get("sportType") || undefined,
      eventType: searchParams.get("eventType") || undefined,
      status: searchParams.get("status") || "ALL",
      facilityId: searchParams.get("facilityId") || undefined,
      from: searchParams.get("from") || undefined,
      to: searchParams.get("to") || undefined,
      mine: searchParams.get("mine") === "true",
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          status: "error",
          message: "Invalid query parameters",
          errors: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const result = await getEvents({
      ...parsed.data,
      teacherId: user.id,
    });

    return NextResponse.json({
      status: "success",
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ status: "error", message: publicErrorMessage(message) }, { status: 500 });
  }
}

// POST /api/events - Create new event (Teacher or Admin)
export async function POST(req: NextRequest) {
  try {
    const authResult = await validateApiAuth(["TEACHER", "ADMIN"]);
    if ("response" in authResult) {
      return authResult.response;
    }
    const { user } = authResult;

    const body = await req.json();
    const parsed = createEventSchema.safeParse(body);

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

    const event = await createEvent(parsed.data, user.id);

    return NextResponse.json(
      {
        status: "success",
        message: parsed.data.isDraft
          ? "Event draft saved successfully"
          : "Event scheduled and published successfully",
        event,
      },
      { status: 201 }
    );
  } catch (error) {
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
