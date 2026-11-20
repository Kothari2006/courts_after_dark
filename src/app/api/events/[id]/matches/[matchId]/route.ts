import { NextRequest, NextResponse } from "next/server";
import { publicErrorMessage } from "@/lib/api-errors";
import { validateApiAuth } from "@/lib/auth-utils";
import { updateMatchSchema } from "@/lib/validations/event";
import {
  updateTournamentMatch,
  EventForbiddenError,
  EventNotFoundError,
} from "@/services/event.service";

interface RouteContext {
  params: Promise<{ id: string; matchId: string }>;
}

// PATCH /api/events/[id]/matches/[matchId] - Update match score, status, winner
export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const authResult = await validateApiAuth(["TEACHER", "ADMIN"]);
    if ("response" in authResult) {
      return authResult.response;
    }
    const { user } = authResult;
    const { id, matchId } = await context.params;

    const body = await req.json();
    const parsed = updateMatchSchema.safeParse({ ...body, matchId });

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

    const match = await updateTournamentMatch(
      id,
      parsed.data,
      user.id,
      user.role === "ADMIN"
    );

    return NextResponse.json({
      status: "success",
      message: "Match updated successfully",
      match,
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
