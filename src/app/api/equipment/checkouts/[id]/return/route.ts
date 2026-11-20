import { NextRequest, NextResponse } from "next/server";
import { publicErrorMessage } from "@/lib/api-errors";
import { validateApiAuth } from "@/lib/auth-utils";
import { returnEquipmentSchema } from "@/lib/validations/equipment";
import { returnEquipment } from "@/services/equipment.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/equipment/checkouts/[id]/return - Process equipment return (Staff only)
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await validateApiAuth(["EQUIPMENT_MANAGER", "ADMIN"]);
    if ("response" in authResult) {
      return authResult.response;
    }
    const { user } = authResult;

    const { id } = await params;

    let body = {};
    try {
      body = await req.json();
    } catch {
      // Empty body is acceptable if returning with no damages
      body = {};
    }

    const parseResult = returnEquipmentSchema.safeParse(body);
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

    const { damagedItems, notes } = parseResult.data;

    const checkout = await returnEquipment({
      checkoutId: id,
      managerId: user.id,
      damagedItems,
      notes,
    });

    return NextResponse.json({
      status: "success",
      message: "Equipment returned and processed successfully",
      checkout,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";

    switch (message) {
      case "CHECKOUT_NOT_FOUND":
        return NextResponse.json(
          { status: "error", message: "Checkout record not found" },
          { status: 404 }
        );
      case "INVALID_STATUS":
      case "DUPLICATE_RETURN":
        return NextResponse.json(
          {
            status: "error",
            message: "Only checkouts with ISSUED or OVERDUE status can be returned",
          },
          { status: 400 }
        );
      case "INVALID_DAMAGED_QUANTITY":
        return NextResponse.json(
          {
            status: "error",
            message: "Damaged quantity cannot exceed the issued quantity for an item",
          },
          { status: 400 }
        );
      default:
        return NextResponse.json({ status: "error", message: publicErrorMessage(message) }, { status: 500 });
    }
  }
}
