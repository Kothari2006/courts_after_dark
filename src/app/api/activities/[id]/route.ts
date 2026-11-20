import { NextRequest, NextResponse } from "next/server";
import { publicErrorMessage } from "@/lib/api-errors";
import { validateApiAuth } from "@/lib/auth-utils";
import {
  updateActivitySchema,
  cancelActivitySchema,
} from "@/lib/validations/activity";
import {
  getActivityById,
  updateActivity,
  cancelActivity,
  ActivityConflictError,
  ActivityForbiddenError,
  ActivityNotFoundError,
} from "@/services/activity.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/activities/[id]
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const authResult = await validateApiAuth(["STUDENT", "TEACHER", "ADMIN"]);
    if ("response" in authResult) {
      return authResult.response;
    }

    const { id } = await context.params;
    const activity = await getActivityById(id);

    return NextResponse.json({
      status: "success",
      activity,
    });
  } catch (error) {
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

// PATCH /api/activities/[id] - Edit activity (Owner Teacher or Admin only)
export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const authResult = await validateApiAuth(["TEACHER", "ADMIN"]);
    if ("response" in authResult) {
      return authResult.response;
    }
    const { user } = authResult;
    const { id } = await context.params;

    const body = await req.json();
    const parsed = updateActivitySchema.safeParse(body);

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

    const updated = await updateActivity(
      id,
      parsed.data,
      user.id,
      user.role === "ADMIN"
    );

    return NextResponse.json({
      status: "success",
      message: "Activity updated successfully",
      activity: updated,
    });
  } catch (error) {
    if (error instanceof ActivityForbiddenError) {
      return NextResponse.json(
        { status: "error", message: error.message },
        { status: 403 }
      );
    }
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

// DELETE /api/activities/[id] - Cancel activity (Owner Teacher or Admin only)
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const authResult = await validateApiAuth(["TEACHER", "ADMIN"]);
    if ("response" in authResult) {
      return authResult.response;
    }
    const { user } = authResult;
    const { id } = await context.params;

    let reason: string | undefined;
    try {
      const body = await req.json();
      const parsed = cancelActivitySchema.safeParse(body);
      if (parsed.success) {
        reason = parsed.data.reason;
      }
    } catch {
      // Empty body is allowed for DELETE
    }

    const cancelled = await cancelActivity(
      id,
      reason,
      user.id,
      user.role === "ADMIN"
    );

    return NextResponse.json({
      status: "success",
      message: "Activity cancelled successfully",
      activity: cancelled,
    });
  } catch (error) {
    if (error instanceof ActivityForbiddenError) {
      return NextResponse.json(
        { status: "error", message: error.message },
        { status: 403 }
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

