import { NextRequest, NextResponse } from "next/server";
import { publicErrorMessage } from "@/lib/api-errors";
import { validateApiAuth } from "@/lib/auth-utils";
import { getStudentBookingsForTeacher } from "@/services/teacher.service";
import connectToDatabase from "@/lib/mongodb";
import DemoBooking from "@/models/DemoBooking";

// GET /api/teacher/bookings - View student bookings (read-only for teachers)
export async function GET(req: NextRequest) {
  try {
    const authResult = await validateApiAuth(["TEACHER", "ADMIN"]);
    if ("response" in authResult) {
      return authResult.response;
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const search = searchParams.get("search") || undefined;
    const facilityId = searchParams.get("facilityId") || undefined;
    const sportType = searchParams.get("sportType") || undefined;
    const date = searchParams.get("date") || undefined;
    const status = searchParams.get("status") || "ALL";

    const result = await getStudentBookingsForTeacher({
      page: isNaN(page) ? 1 : page,
      limit: isNaN(limit) ? 20 : limit,
      search,
      facilityId,
      sportType,
      date,
      status,
    });

    await connectToDatabase();
    const demoRecords = await DemoBooking.find({})
      .populate("user", "name email role")
      .sort({ startAt: -1 })
      .lean();

    const demoBookings = demoRecords.map((booking) => ({
      _id: booking.externalId,
      user: booking.user,
      facility: {
        _id: booking.facilityId,
        name: booking.facilityName,
        sportType: booking.sportType,
        location: booking.location,
      },
      bookingDate: booking.bookingDate,
      startTime: booking.startTime,
      endTime: booking.endTime,
      startAt: booking.startAt,
      endAt: booking.endAt,
      status: booking.status,
      bookingType: booking.bookingType,
      attendanceStatus: booking.attendanceStatus,
    }));

    const existingIds = new Set(result.bookings.map((booking: { _id: unknown }) => String(booking._id)));
    const combinedBookings = [
      ...result.bookings,
      ...demoBookings.filter((booking) => !existingIds.has(String(booking._id))),
    ];

    return NextResponse.json({
      status: "success",
      ...result,
      bookings: combinedBookings,
      pagination: {
        ...result.pagination,
        total: result.pagination.total + combinedBookings.length - result.bookings.length,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ status: "error", message: publicErrorMessage(message) }, { status: 500 });
  }
}

