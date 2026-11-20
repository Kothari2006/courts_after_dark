import { NextRequest, NextResponse } from "next/server";
import { publicErrorMessage } from "@/lib/api-errors";
import { validateApiAuth } from "@/lib/auth-utils";
import {
  joinActivity,
  ActivityConflictError,
  ActivityNotFoundError,
} from "@/services/activity.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// POST /api/activities/[id]/join - Join a scheduled activity
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const authResult = await validateApiAuth(["STUDENT", "TEACHER", "ADMIN"]);
    if ("response" in authResult) {
      return authResult.response;
    }
    const { user } = authResult;
    const { id } = await context.params;

    const activity = await joinActivity(id, user.id);

    return NextResponse.json({
      status: "success",
      message: "Successfully joined activity",
      activity,
    });
  } catch (error) {
    if (error instanceof ActivityConflictError) {
      return NextResponse.json(
        { status: "error", message: error.message },
        { status: 409 }
      );
    }
    if (error instanceof ActivityNotFoundError) {
      return NextResponse.json(
        { status: "error", message: error.message },
        { status: 404 }
      );
    }
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ status: "error", message: publicErrorMessage(message) }, { status: 500 });
  }
}

