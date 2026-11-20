import { NextRequest, NextResponse } from "next/server";
import { publicErrorMessage } from "@/lib/api-errors";
import { validateApiAuth } from "@/lib/auth-utils";
import {
  userIdParamSchema,
  updateUserStatusSchema,
} from "@/lib/validations/user";
import { updateUserStatus } from "@/services/user.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/admin/users/[id]/status - Update account activation status (Admin only)
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await validateApiAuth(["ADMIN"]);
    if ("response" in authResult) {
      return authResult.response;
    }
    const adminUser = authResult.user;

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

    const body = await req.json();
    const bodyValidation = updateUserStatusSchema.safeParse(body);
    if (!bodyValidation.success) {
      return NextResponse.json(
        {
          status: "error",
          message: "Validation failed",
          errors: bodyValidation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const result = await updateUserStatus({
      adminId: adminUser.id,
      targetUserId: id,
      isActive: bodyValidation.data.isActive,
      reason: bodyValidation.data.reason,
    });

    const statusLabel = bodyValidation.data.isActive ? "activated" : "deactivated";

    return NextResponse.json({
      status: "success",
      message: `User account has been successfully ${statusLabel}`,
      ...result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";

    if (message === "CANNOT_DEACTIVATE_LAST_ADMIN") {
      return NextResponse.json(
        {
          status: "error",
          message:
            "Action prohibited: Cannot deactivate the last active administrator account.",
        },
        { status: 400 }
      );
    }
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

