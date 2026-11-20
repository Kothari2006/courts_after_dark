import { NextRequest, NextResponse } from "next/server";
import { validateApiAuth } from "@/lib/auth-utils";
import { adminBookingQuerySchema } from "@/lib/validations/booking";
import { getAdminBookings } from "@/services/booking.service";

export async function GET(req: NextRequest) {
  try {
    const authResult = await validateApiAuth(["ADMIN"]);
    if ("response" in authResult) {
      return authResult.response;
    }

    const { searchParams } = new URL(req.url);
    const rawParams = {
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      facilityId: searchParams.get("facilityId") ?? undefined,
      sportType: searchParams.get("sportType") ?? undefined,
      bookingType: searchParams.get("bookingType") ?? undefined,
      startDate: searchParams.get("startDate") ?? undefined,
      endDate: searchParams.get("endDate") ?? undefined,
      sort: searchParams.get("sort") ?? undefined,
    };

    const parseResult = adminBookingQuerySchema.safeParse(rawParams);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          status: "error",
          message: "Invalid query parameters",
          errors: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    const data = await getAdminBookings(parseResult.data);

    return NextResponse.json({
      status: "success",
      ...data,
    });
  } catch (error) {
    console.error("Admin bookings query error:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to retrieve bookings" },
      { status: 500 }
    );
  }
}
