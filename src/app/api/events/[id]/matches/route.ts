import { NextRequest, NextResponse } from "next/server";
import { publicErrorMessage } from "@/lib/api-errors";
import { validateApiAuth } from "@/lib/auth-utils";
import { createMatchSchema } from "@/lib/validations/event";
import {
  getEventById,
  createTournamentMatch,
  EventForbiddenError,
  EventNotFoundError,
} from "@/services/event.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/events/[id]/matches - Get tournament match schedule
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
      eventId: event._id,
      tournamentMatches: event.tournamentMatches || [],
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

// POST /api/events/[id]/matches - Add a tournament match
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const authResult = await validateApiAuth(["TEACHER", "ADMIN"]);
    if ("response" in authResult) {
      return authResult.response;
    }
    const { user } = authResult;
    const { id } = await context.params;

    const body = await req.json();
    const parsed = createMatchSchema.safeParse(body);

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

    const match = await createTournamentMatch(
      id,
      parsed.data,
      user.id,
      user.role === "ADMIN"
    );

    return NextResponse.json(
      {
        status: "success",
        message: "Match created successfully",
        match,
      },
      { status: 201 }
    );
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
