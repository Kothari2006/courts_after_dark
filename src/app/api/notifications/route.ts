import { NextRequest, NextResponse } from "next/server";
import { validateApiAuth } from "@/lib/auth-utils";
import {
  getUserNotifications,
  markAllNotificationsAsRead,
} from "@/services/notification.service";
import { notificationQuerySchema } from "@/lib/validations/notification";

export async function GET(req: NextRequest) {
  try {
    const authResult = await validateApiAuth();
    if ("response" in authResult) return authResult.response;
    const { user } = authResult;

    const parsed = notificationQuerySchema.safeParse(
      Object.fromEntries(new URL(req.url).searchParams)
    );
    if (!parsed.success) {
      return NextResponse.json(
        { status: "error", message: "Invalid query parameters" },
        { status: 400 }
      );
    }

    const result = await getUserNotifications(user.id, parsed.data);
    return NextResponse.json({ status: "success", ...result });
  } catch (error) {
    console.error("Error retrieving notifications:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to retrieve notifications" },
      { status: 500 }
    );
  }
}

/** PATCH /api/notifications — mark every notification as read. */
export async function PATCH() {
  try {
    const authResult = await validateApiAuth();
    if ("response" in authResult) return authResult.response;

    const result = await markAllNotificationsAsRead(authResult.user.id);
    return NextResponse.json({ status: "success", ...result });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to update notifications" },
      { status: 500 }
    );
  }
}
