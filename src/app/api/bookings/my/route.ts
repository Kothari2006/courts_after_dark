import { NextRequest, NextResponse } from "next/server";
import { validateApiAuth } from "@/lib/auth-utils";
import { getUserBookings } from "@/services/booking.service";

export async function GET(req: NextRequest) {
  try {
    const authResult = await validateApiAuth();
    if ("response" in authResult) {
      return authResult.response;
    }
    const { user } = authResult;

    const { searchParams } = new URL(req.url);
    const filterParam = searchParams.get("filter")?.toUpperCase() || "ALL";
    const pageParam = parseInt(searchParams.get("page") || "1", 10);
    const limitParam = parseInt(searchParams.get("limit") || "10", 10);

    const validFilters = ["ALL", "UPCOMING", "COMPLETED", "CANCELLED"] as const;
    const filter = validFilters.includes(filterParam as (typeof validFilters)[number])
      ? (filterParam as (typeof validFilters)[number])
      : "ALL";

    const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
    const limit = isNaN(limitParam) || limitParam < 1 ? 10 : Math.min(limitParam, 50);

    const result = await getUserBookings({
      userId: user.id,
      filter,
      page,
      limit,
    });

    return NextResponse.json({
      status: "success",
      ...result,
    });
  } catch (error) {
    console.error("Error retrieving user bookings:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to retrieve student bookings",
      },
      { status: 500 }
    );
  }
}

