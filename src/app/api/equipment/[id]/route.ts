import { NextRequest, NextResponse } from "next/server";
import { publicErrorMessage } from "@/lib/api-errors";
import { validateApiAuth } from "@/lib/auth-utils";
import { updateEquipmentSchema } from "@/lib/validations/equipment";
import {
  getEquipmentById,
  updateEquipment,
  deactivateEquipment,
} from "@/services/equipment.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/equipment/[id] - Get details of single equipment
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await validateApiAuth();
    if ("response" in authResult) {
      return authResult.response;
    }

    const { id } = await params;
    const equipment = await getEquipmentById(id);

    return NextResponse.json({
      status: "success",
      equipment,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    if (message === "EQUIPMENT_NOT_FOUND") {
      return NextResponse.json(
        { status: "error", message: "Equipment not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ status: "error", message: publicErrorMessage(message) }, { status: 500 });
  }
}

// PATCH /api/equipment/[id] - Update equipment (Staff only)
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await validateApiAuth(["EQUIPMENT_MANAGER", "ADMIN"]);
    if ("response" in authResult) {
      return authResult.response;
    }

    const { id } = await params;
    const body = await req.json();
    const parseResult = updateEquipmentSchema.safeParse(body);

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const equipment = await updateEquipment(id, parseResult.data as any);

    return NextResponse.json({
      status: "success",
      message: "Equipment updated successfully",
      equipment,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    if (message === "EQUIPMENT_NOT_FOUND") {
      return NextResponse.json(
        { status: "error", message: "Equipment not found" },
        { status: 404 }
      );
    }
    if (message === "INVALID_INVENTORY_MATH") {
      return NextResponse.json(
        {
          status: "error",
          message: "Sum of available and damaged quantities exceeds total quantity",
        },
        { status: 400 }
      );
    }
    return NextResponse.json({ status: "error", message: publicErrorMessage(message) }, { status: 500 });
  }
}

// DELETE /api/equipment/[id] - Deactivate equipment (Staff only)
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await validateApiAuth(["EQUIPMENT_MANAGER", "ADMIN"]);
    if ("response" in authResult) {
      return authResult.response;
    }

    const { id } = await params;
    const equipment = await deactivateEquipment(id);

    return NextResponse.json({
      status: "success",
      message: "Equipment deactivated successfully",
      equipment,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    if (message === "EQUIPMENT_NOT_FOUND") {
      return NextResponse.json(
        { status: "error", message: "Equipment not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ status: "error", message: publicErrorMessage(message) }, { status: 500 });
  }
}
