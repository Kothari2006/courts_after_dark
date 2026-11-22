import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { validateApiAuth } from "@/lib/auth-utils";
import connectToDatabase from "@/lib/mongodb";
import EquipmentCheckout from "@/models/EquipmentCheckout";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await validateApiAuth(["TEACHER", "EQUIPMENT_MANAGER", "ADMIN"]);
    if ("response" in authResult) return authResult.response;

    const { action } = await req.json();
    if (!["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json(
        { status: "error", message: "Invalid action" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const { id } = await params;
    const checkout = await EquipmentCheckout.findById(id);
    if (!checkout) {
      return NextResponse.json(
        { status: "error", message: "Equipment request not found" },
        { status: 404 }
      );
    }
    if (checkout.status !== "REQUESTED") {
      return NextResponse.json(
        { status: "error", message: "Only requested items can be reviewed" },
        { status: 400 }
      );
    }

    checkout.status = action === "APPROVE" ? "APPROVED" : "REJECTED";
    checkout.reviewedBy = new mongoose.Types.ObjectId(authResult.user.id);
    checkout.reviewedAt = new Date();
    await checkout.save();

    return NextResponse.json({
      status: "success",
      message: action === "APPROVE" ? "Equipment request approved" : "Equipment request rejected",
      checkout,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
