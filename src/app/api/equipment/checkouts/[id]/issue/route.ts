import { NextRequest, NextResponse } from "next/server";
import { publicErrorMessage } from "@/lib/api-errors";
import { validateApiAuth } from "@/lib/auth-utils";
import { issueEquipment } from "@/services/equipment.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/equipment/checkouts/[id]/issue - Issue requested equipment (Staff only)
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await validateApiAuth(["EQUIPMENT_MANAGER", "ADMIN"]);
    if ("response" in authResult) {
      return authResult.response;
    }
    const { user } = authResult;

    const { id } = await params;

    const checkout = await issueEquipment({
      checkoutId: id,
      managerId: user.id,
    });

    return NextResponse.json({
      status: "success",
      message: "Equipment issued successfully",
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
      case "DUPLICATE_ISSUE":
        return NextResponse.json(
          {
            status: "error",
            message: "Only requests with REQUESTED status can be issued",
          },
          { status: 400 }
        );
      case "INSUFFICIENT_STOCK":
        return NextResponse.json(
          {
            status: "error",
            message: "Insufficient available stock to issue this equipment",
          },
          { status: 400 }
        );
      default:
        return NextResponse.json({ status: "error", message: publicErrorMessage(message) }, { status: 500 });
    }
  }
}
