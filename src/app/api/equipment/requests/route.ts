import { NextRequest, NextResponse } from "next/server";
import { publicErrorMessage } from "@/lib/api-errors";
import { validateApiAuth } from "@/lib/auth-utils";
import { createEquipmentRequestSchema } from "@/lib/validations/equipment";
import {
  requestEquipment,
  getManagerCheckouts,
} from "@/services/equipment.service";
import { CheckoutStatus } from "@/models/EquipmentCheckout";

// GET /api/equipment/requests - List equipment requests (Staff only)
export async function GET(req: NextRequest) {
  try {
    const authResult = await validateApiAuth(["EQUIPMENT_MANAGER", "ADMIN"]);
    if ("response" in authResult) {
      return authResult.response;
    }

    const { searchParams } = new URL(req.url);
    const status = (searchParams.get("status") as CheckoutStatus) || "REQUESTED";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const result = await getManagerCheckouts({
      status: status === ("ALL" as unknown) ? undefined : status,
      page: isNaN(page) ? 1 : page,
      limit: isNaN(limit) ? 20 : limit,
    });

    return NextResponse.json({
      status: "success",
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ status: "error", message: publicErrorMessage(message) }, { status: 500 });
  }
}

// POST /api/equipment/requests - Submit equipment request for booking (Student)
export async function POST(req: NextRequest) {
  try {
    const authResult = await validateApiAuth();
    if ("response" in authResult) {
      return authResult.response;
    }
    const { user } = authResult;

    const body = await req.json();
    const parseResult = createEquipmentRequestSchema.safeParse(body);

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

    const { bookingId, items, expectedReturnAt, notes } = parseResult.data;

    const checkout = await requestEquipment({
      userId: user.id,
      bookingId,
      items,
      expectedReturnAt,
      notes,
    });

    return NextResponse.json(
      {
        status: "success",
        message: "Equipment request submitted successfully",
        checkout,
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";

    switch (message) {
      case "BOOKING_NOT_FOUND":
        return NextResponse.json(
          { status: "error", message: "Booking not found" },
          { status: 404 }
        );
      case "BOOKING_NOT_CONFIRMED":
        return NextResponse.json(
          {
            status: "error",
            message: "Equipment can only be requested for confirmed bookings",
          },
          { status: 400 }
        );
      case "FORBIDDEN_BOOKING":
      case "BOOKING_NOT_OWNED":
        return NextResponse.json(
          {
            status: "error",
            message: "You can only request equipment for your own bookings",
          },
          { status: 403 }
        );
      case "INVALID_RETURN_TIME":
        return NextResponse.json(
          {
            status: "error",
            message: "Expected return time cannot exceed booking end time",
          },
          { status: 400 }
        );
      case "EQUIPMENT_NOT_FOUND":
        return NextResponse.json(
          { status: "error", message: "One or more requested equipment items not found" },
          { status: 404 }
        );
      case "EQUIPMENT_UNAVAILABLE":
        return NextResponse.json(
          { status: "error", message: "One or more equipment items are currently unavailable" },
          { status: 400 }
        );
      case "INSUFFICIENT_STOCK":
        return NextResponse.json(
          {
            status: "error",
            message: "Requested quantity exceeds available inventory",
          },
          { status: 400 }
        );
      default:
        return NextResponse.json({ status: "error", message: publicErrorMessage(message) }, { status: 500 });
    }
  }
}
