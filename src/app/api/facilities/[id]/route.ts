import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongodb";
import Facility from "@/models/Facility";
import Booking from "@/models/Booking";
import { validateApiAuth } from "@/lib/auth-utils";
import { updateFacilitySchema } from "@/lib/validations/facility";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { status: "error", message: "Invalid facility ID format" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const authResult = await validateApiAuth();
    const isAdminUser = "user" in authResult && authResult.user.role === "ADMIN";

    const facility = await Facility.findById(id).lean();

    if (!facility) {
      return NextResponse.json(
        { status: "error", message: "Facility not found" },
        { status: 404 }
      );
    }

    // Students cannot view inactive facilities
    if (!isAdminUser && facility.status === "INACTIVE") {
      return NextResponse.json(
        { status: "error", message: "Facility is currently inactive and unavailable" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { status: "success", data: facility },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/facilities/[id] error:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to retrieve facility details" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await validateApiAuth(["ADMIN"]);
    if ("response" in authResult) {
      return authResult.response;
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { status: "error", message: "Invalid facility ID format" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parsed = updateFacilitySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          status: "error",
          message: parsed.error.issues[0]?.message || "Validation failed",
          errors: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const updated = await Facility.findByIdAndUpdate(id, parsed.data, {
      new: true,
      runValidators: true,
    }).lean();

    if (!updated) {
      return NextResponse.json(
        { status: "error", message: "Facility not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        status: "success",
        message: "Facility updated successfully",
        data: updated,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH /api/facilities/[id] error:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to update facility" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await validateApiAuth(["ADMIN"]);
    if ("response" in authResult) {
      return authResult.response;
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { status: "error", message: "Invalid facility ID format" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const facility = await Facility.findById(id);
    if (!facility) {
      return NextResponse.json(
        { status: "error", message: "Facility not found" },
        { status: 404 }
      );
    }

    // Check for existing booking history
    const bookingCount = await Booking.countDocuments({ facility: id });

    // Always prefer soft deactivation to prevent breaking foreign keys/indexes
    facility.status = "INACTIVE";
    await facility.save();

    const message =
      bookingCount > 0
        ? `Facility deactivated (preserved ${bookingCount} existing booking records)`
        : "Facility deactivated successfully";

    return NextResponse.json(
      {
        status: "success",
        message,
        data: facility,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/facilities/[id] error:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to process facility deactivation" },
      { status: 500 }
    );
  }
}

