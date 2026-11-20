import { NextRequest, NextResponse } from "next/server";
import { validateApiAuth } from "@/lib/auth-utils";
import {
  deleteNotification,
  markNotificationAsRead,
} from "@/services/notification.service";
import { notificationIdSchema } from "@/lib/validations/notification";

type Ctx = { params: Promise<{ id: string }> };

function errorResponse(error: unknown) {
  const code = error instanceof Error ? error.message : "";
  if (code === "NOTIFICATION_NOT_FOUND")
    return NextResponse.json({ status: "error", message: "Notification not found" }, { status: 404 });
  if (code === "FORBIDDEN")
    return NextResponse.json({ status: "error", message: "Forbidden" }, { status: 403 });
  if (code === "INVALID_NOTIFICATION_ID")
    return NextResponse.json({ status: "error", message: "Invalid notification ID" }, { status: 400 });
  console.error("Notification route error:", error);
  return NextResponse.json({ status: "error", message: "Request failed" }, { status: 500 });
}

export async function PATCH(_req: NextRequest, { params }: Ctx) {
  try {
    const authResult = await validateApiAuth();
    if ("response" in authResult) return authResult.response;
    const parsed = notificationIdSchema.safeParse(await params);
    if (!parsed.success)
      return NextResponse.json({ status: "error", message: "Invalid notification ID" }, { status: 400 });

    const notification = await markNotificationAsRead(parsed.data.id, authResult.user.id);
    return NextResponse.json({ status: "success", notification });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const authResult = await validateApiAuth();
    if ("response" in authResult) return authResult.response;
    const parsed = notificationIdSchema.safeParse(await params);
    if (!parsed.success)
      return NextResponse.json({ status: "error", message: "Invalid notification ID" }, { status: 400 });

    await deleteNotification(parsed.data.id, authResult.user.id);
    return NextResponse.json({ status: "success" });
  } catch (error) {
    return errorResponse(error);
  }
}
