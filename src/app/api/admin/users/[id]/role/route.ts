import { NextRequest, NextResponse } from "next/server";
import { publicErrorMessage } from "@/lib/api-errors";
import { validateApiAuth } from "@/lib/auth-utils";
import {
  userIdParamSchema,
  updateUserRoleSchema,
} from "@/lib/validations/user";
import { updateUserRole } from "@/services/user.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/admin/users/[id]/role - Change user role (Admin only)
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
    const bodyValidation = updateUserRoleSchema.safeParse(body);
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

    const result = await updateUserRole({
      adminId: adminUser.id,
      targetUserId: id,
      newRole: bodyValidation.data.role,
      reason: bodyValidation.data.reason,
    });

    return NextResponse.json({
      status: "success",
      message: `User role successfully changed to ${bodyValidation.data.role}`,
      ...result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";

    if (message === "CANNOT_DEMOTE_LAST_ADMIN") {
      return NextResponse.json(
        {
          status: "error",
          message:
            "Action prohibited: Cannot remove or demote the last active administrator account.",
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

