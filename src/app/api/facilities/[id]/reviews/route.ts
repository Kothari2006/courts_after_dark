import { NextRequest, NextResponse } from "next/server";
import { publicErrorMessage } from "@/lib/api-errors";
import { getFacilityReviews } from "@/services/review.service";
import mongoose from "mongoose";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/facilities/[id]/reviews - Public approved reviews and rating metrics
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { status: "error", message: "Invalid facility ID format" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const result = await getFacilityReviews(
      id,
      isNaN(page) ? 1 : page,
      isNaN(limit) ? 10 : limit
    );

    return NextResponse.json({
      status: "success",
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ status: "error", message: publicErrorMessage(message) }, { status: 500 });
  }
}

