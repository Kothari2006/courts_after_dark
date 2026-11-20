import { NextRequest, NextResponse } from "next/server";
import { publicErrorMessage } from "@/lib/api-errors";
import { validateApiAuth } from "@/lib/auth-utils";
import {
  createActivitySchema,
  activityQuerySchema,
} from "@/lib/validations/activity";
import {
  createActivity,
  getActivities,
  ActivityConflictError,
  ActivityNotFoundError,
} from "@/services/activity.service";

// GET /api/activities - Retrieve activities
export async function GET(req: NextRequest) {
  try {
    const authResult = await validateApiAuth(["STUDENT", "TEACHER", "ADMIN"]);
    if ("response" in authResult) {
      return authResult.response;
    }
    const { user } = authResult;

    const { searchParams } = new URL(req.url);
    const parsed = activityQuerySchema.safeParse({
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || 20,
      search: searchParams.get("search") || undefined,
      facilityId: searchParams.get("facilityId") || undefined,
      sportType: searchParams.get("sportType") || undefined,
      status: searchParams.get("status") || "ALL",
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

    const result = await getActivities({
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

// POST /api/activities - Create a new activity (Teacher or Admin only)
export async function POST(req: NextRequest) {
  try {
    const authResult = await validateApiAuth(["TEACHER", "ADMIN"]);
    if ("response" in authResult) {
      return authResult.response;
    }
    const { user } = authResult;

    const body = await req.json();
    const parsed = createActivitySchema.safeParse(body);

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

    const activity = await createActivity(parsed.data, user.id);

    return NextResponse.json(
      {
        status: "success",
        message: "Activity created successfully",
        activity,
      },
      { status: 201 }
    );
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

