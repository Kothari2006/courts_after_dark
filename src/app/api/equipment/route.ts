import { NextRequest, NextResponse } from "next/server";
import { publicErrorMessage } from "@/lib/api-errors";
import { validateApiAuth } from "@/lib/auth-utils";
import { createEquipmentSchema } from "@/lib/validations/equipment";
import {
  createEquipment,
  getEquipmentList,
} from "@/services/equipment.service";
import { EquipmentCategory } from "@/models/Equipment";

// GET /api/equipment - List equipment catalog
export async function GET(req: NextRequest) {
  try {
    const authResult = await validateApiAuth();
    if ("response" in authResult) {
      return authResult.response;
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") as EquipmentCategory | undefined;
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") as "AVAILABLE" | "UNAVAILABLE" | "ALL" | undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const result = await getEquipmentList({
      category: category && category !== ("ALL" as unknown) ? category : undefined,
      search,
      status: status || "ALL",
      page: isNaN(page) ? 1 : page,
      limit: isNaN(limit) ? 20 : limit,
    });

    return NextResponse.json({
      status: "success",
      equipment: result.items,
      items: result.items,
      pagination: result.pagination,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ status: "error", message: publicErrorMessage(message) }, { status: 500 });
  }
}

// POST /api/equipment - Create new equipment (Staff only)
export async function POST(req: NextRequest) {
  try {
    const authResult = await validateApiAuth(["EQUIPMENT_MANAGER", "ADMIN"]);
    if ("response" in authResult) {
      return authResult.response;
    }

    const body = await req.json();
    const parseResult = createEquipmentSchema.safeParse(body);

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
    const equipment = await createEquipment(parseResult.data as any);

    return NextResponse.json(
      {
        status: "success",
        message: "Equipment added successfully",
        equipment,
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ status: "error", message: publicErrorMessage(message) }, { status: 500 });
  }
}
