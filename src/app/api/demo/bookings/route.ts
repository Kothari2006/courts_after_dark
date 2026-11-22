import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { validateApiAuth } from "@/lib/auth-utils";
import connectToDatabase from "@/lib/mongodb";
import DemoBooking from "@/models/DemoBooking";
import User from "@/models/User";

export async function GET() {
  try {
    const authResult = await validateApiAuth(["TEACHER", "ADMIN", "STUDENT"]);
    if ("response" in authResult) return authResult.response;

    await connectToDatabase();
    const query =
      authResult.user.role === "STUDENT"
        ? { user: new mongoose.Types.ObjectId(authResult.user.id) }
        : {};
    const bookings = await DemoBooking.find(query)
      .populate("user", "name email role")
      .sort({ startAt: -1 })
      .lean();

    return NextResponse.json({ status: "success", bookings });
  } catch (error) {
    return NextResponse.json(
      { status: "error", message: error instanceof Error ? error.message : "Failed to load demo bookings" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await validateApiAuth(["STUDENT"]);
    if ("response" in authResult) return authResult.response;

    const body = await req.json();
    if (!body.id || !body.facilityName || !body.startAt || !body.endAt) {
      return NextResponse.json(
        { status: "error", message: "Missing demo booking details" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const user = await User.findById(authResult.user.id);
    if (!user) {
      return NextResponse.json(
        { status: "error", message: "Student account not found" },
        { status: 404 }
      );
    }

    const booking = await DemoBooking.findOneAndUpdate(
      { externalId: body.id },
      {
        user: user._id,
        externalId: body.id,
        facilityId: body.facilityId,
        facilityName: body.facilityName,
        sportType: body.sportType || "SPORTS",
        location: body.location || "",
        bookingDate: body.bookingDate,
        startTime: body.startTime,
        endTime: body.endTime,
        startAt: new Date(body.startAt),
        endAt: new Date(body.endAt),
        status: "CONFIRMED",
        bookingType: body.bookingType || "REGULAR",
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({ status: "success", booking }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { status: "error", message: error instanceof Error ? error.message : "Failed to save demo booking" },
      { status: 500 }
    );
  }
}
