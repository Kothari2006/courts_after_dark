import { NextRequest, NextResponse } from "next/server";
import { validateApiAuth } from "@/lib/auth-utils";
import connectToDatabase from "@/lib/mongodb";
import BookingPolicy from "@/models/BookingPolicy";
import { updatePolicySchema } from "@/lib/validations/policy";
import { getActiveBookingPolicy } from "@/services/booking.service";

export async function GET() {
  try {
    const authResult = await validateApiAuth(["ADMIN"]);
    if ("response" in authResult) {
      return authResult.response;
    }

    const policy = await getActiveBookingPolicy();

    return NextResponse.json({
      status: "success",
      policy,
    });
  } catch (error) {
    console.error("Error fetching policy:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to fetch booking policy" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authResult = await validateApiAuth(["ADMIN"]);
    if ("response" in authResult) {
      return authResult.response;
    }

    const body = await req.json();
    const parseResult = updatePolicySchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          status: "error",
          message: "Validation failed",
          errors: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    await connectToDatabase();

    let policy = await BookingPolicy.findOne({ isActive: true });
    if (!policy) {
      policy = new BookingPolicy({ isActive: true });
    }

    Object.assign(policy, parseResult.data);
    await policy.save();

    return NextResponse.json({
      status: "success",
      message: "Fair-play booking policy updated successfully",
      policy,
    });
  } catch (error) {
    console.error("Error updating policy:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to update booking policy" },
      { status: 500 }
    );
  }
}

