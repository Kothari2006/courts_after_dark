import { NextRequest, NextResponse } from "next/server";
import { publicErrorMessage } from "@/lib/api-errors";
import { validateApiAuth } from "@/lib/auth-utils";
import { getCheckoutById } from "@/services/equipment.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/equipment/requests/[id] - Get details of request or checkout
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await validateApiAuth();
    if ("response" in authResult) {
      return authResult.response;
    }
    const { user } = authResult;

    const { id } = await params;
    const isStaff = user.role === "EQUIPMENT_MANAGER" || user.role === "ADMIN";

    const checkout = await getCheckoutById(id, user.id, isStaff);

    return NextResponse.json({
      status: "success",
      checkout,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    if (message === "CHECKOUT_NOT_FOUND") {
      return NextResponse.json(
        { status: "error", message: "Checkout request not found" },
        { status: 404 }
      );
    }
    if (message === "FORBIDDEN") {
      return NextResponse.json(
        { status: "error", message: "Forbidden" },
        { status: 403 }
      );
    }
    return NextResponse.json({ status: "error", message: publicErrorMessage(message) }, { status: 500 });
  }
}
