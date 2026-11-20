import { NextRequest, NextResponse } from "next/server";
import { publicErrorMessage } from "@/lib/api-errors";
import { validateApiAuth } from "@/lib/auth-utils";
import { userIdParamSchema } from "@/lib/validations/user";
import { getUserDetails } from "@/services/user.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/admin/users/[id] - Get safe user details, booking, checkout, and audit history (Admin only)
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await validateApiAuth(["ADMIN"]);
    if ("response" in authResult) {
      return authResult.response;
    }

    const { id } = await params;
    const paramValidation = userIdParamSchema.safeParse({ id });
    if (!paramValidation.success) {
      return NextResponse.json(
        {
          status: "error",
          message: "Invalid user ID format",
          errors: paramValidation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const result = await getUserDetails(id);

    return NextResponse.json({
      status: "success",
      ...result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";

    if (message === "USER_NOT_FOUND") {
      return NextResponse.json(
        { status: "error", message: "User not found" },
        { status: 404 }
      );
    }
    if (message === "INVALID_USER_ID") {
      return NextResponse.json(
        { status: "error", message: "Invalid user ID format" },
        { status: 400 }
      );
    }

    return NextResponse.json({ status: "error", message: publicErrorMessage(message) }, { status: 500 });
  }
}

