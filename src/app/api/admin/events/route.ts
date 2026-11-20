import { NextRequest, NextResponse } from "next/server";
import { publicErrorMessage } from "@/lib/api-errors";
import { validateApiAuth } from "@/lib/auth-utils";
import { eventQuerySchema } from "@/lib/validations/event";
import { getEvents } from "@/services/event.service";
import { Event } from "@/models";
import { connectToDatabase } from "@/lib/mongodb";

// GET /api/admin/events - Platform-wide event management for Admins
export async function GET(req: NextRequest) {
  try {
    const authResult = await validateApiAuth(["ADMIN"]);
    if ("response" in authResult) {
      return authResult.response;
    }

    const { searchParams } = new URL(req.url);
    const parsed = eventQuerySchema.safeParse({
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || 10,
      search: searchParams.get("search") || undefined,
      sportType: searchParams.get("sportType") || undefined,
      eventType: searchParams.get("eventType") || undefined,
      status: searchParams.get("status") || "ALL",
      facilityId: searchParams.get("facilityId") || undefined,
      from: searchParams.get("from") || undefined,
      to: searchParams.get("to") || undefined,
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

    await connectToDatabase();

    const [eventsResult, metrics] = await Promise.all([
      getEvents(parsed.data),
      Event.aggregate([
        {
          $group: {
            _id: null,
            totalEvents: { $sum: 1 },
            publishedEvents: {
              $sum: {
                $cond: [
                  { $in: ["$status", ["PUBLISHED", "REGISTRATION_OPEN"]] },
                  1,
                  0,
                ],
              },
            },
            totalRegistrations: { $sum: "$registrationCount" },
            tournaments: {
              $sum: { $cond: [{ $eq: ["$eventType", "TOURNAMENT"] }, 1, 0] },
            },
          },
        },
      ]),
    ]);

    const stats = metrics[0] || {
      totalEvents: 0,
      publishedEvents: 0,
      totalRegistrations: 0,
      tournaments: 0,
    };

    return NextResponse.json({
      status: "success",
      ...eventsResult,
      metrics: stats,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ status: "error", message: publicErrorMessage(message) }, { status: 500 });
  }
}
