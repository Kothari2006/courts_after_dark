import { NextRequest, NextResponse } from "next/server";
import { publicErrorMessage } from "@/lib/api-errors";
import { validateApiAuth } from "@/lib/auth-utils";
import {
  markAttendanceSchema,
  bulkAttendanceSchema,
} from "@/lib/validations/activity";
import {
  getActivityById,
  markActivityAttendance,
  ActivityForbiddenError,
  ActivityNotFoundError,
} from "@/services/activity.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/activities/[id]/attendance - View participant attendance (Owner Teacher or Admin only)
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const authResult = await validateApiAuth(["TEACHER", "ADMIN"]);
    if ("response" in authResult) {
      return authResult.response;
    }
    const { user } = authResult;
    const { id } = await context.params;

    const activity = await getActivityById(id);

    if (user.role !== "ADMIN" && activity.createdBy._id.toString() !== user.id) {
      return NextResponse.json(
        {
          status: "error",
          message: "Attendance management is restricted to the teacher who organized this activity",
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      status: "success",
      activityId: activity._id,
      title: activity.title,
      participants: activity.participants,
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

// POST /api/activities/[id]/attendance - Mark participant attendance (Owner Teacher or Admin only)
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const authResult = await validateApiAuth(["TEACHER", "ADMIN"]);
    if ("response" in authResult) {
      return authResult.response;
    }
    const { user } = authResult;
    const { id } = await context.params;

    const body = await req.json();

    // Support single participant update or bulk updates
    let recordsToUpdate: Array<{ participantId: string; status: "REGISTERED" | "PRESENT" | "ABSENT" }> = [];

    if (body.records && Array.isArray(body.records)) {
      const parsedBulk = bulkAttendanceSchema.safeParse(body);
      if (!parsedBulk.success) {
        return NextResponse.json(
          {
            status: "error",
            message: "Validation failed",
            errors: parsedBulk.error.issues,
          },
          { status: 400 }
        );
      }
      recordsToUpdate = parsedBulk.data.records;
    } else {
      const parsedSingle = markAttendanceSchema.safeParse(body);
      if (!parsedSingle.success) {
        return NextResponse.json(
          {
            status: "error",
            message: "Validation failed",
            errors: parsedSingle.error.issues,
          },
          { status: 400 }
        );
      }
      recordsToUpdate = [parsedSingle.data];
    }

    const updated = await markActivityAttendance(
      id,
      recordsToUpdate,
      user.id,
      user.role === "ADMIN"
    );

    return NextResponse.json({
      status: "success",
      message: "Attendance updated successfully",
      activity: updated,
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

