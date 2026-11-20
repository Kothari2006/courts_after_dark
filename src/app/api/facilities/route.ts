import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Facility from "@/models/Facility";
import { validateApiAuth } from "@/lib/auth-utils";
import { createFacilitySchema, SPORT_TYPES } from "@/lib/validations/facility";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const sportType = searchParams.get("sportType")?.trim()?.toUpperCase() || "";
    const location = searchParams.get("location")?.trim() || "";
    const statusParam = searchParams.get("status")?.trim()?.toUpperCase();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "12", 10)));
    const skip = (page - 1) * limit;

    // Determine authorization to decide visible statuses
    const authResult = await validateApiAuth();
    const isAdminUser = "user" in authResult && authResult.user.role === "ADMIN";

    // Build query filter
    const query: Record<string, unknown> = {};

    // Students only see ACTIVE facilities; Admins can filter by specific status or see all
    if (!isAdminUser) {
      query.status = "ACTIVE";
    } else if (statusParam && ["ACTIVE", "INACTIVE", "MAINTENANCE"].includes(statusParam)) {
      query.status = statusParam;
    }

    if (sportType && SPORT_TYPES.includes(sportType as (typeof SPORT_TYPES)[number])) {
      query.sportType = sportType;
    }

    if (location) {
      query.location = { $regex: location, $options: "i" };
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const [total, facilities] = await Promise.all([
      Facility.countDocuments(query),
      Facility.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return NextResponse.json(
      {
        status: "success",
        data: facilities,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/facilities error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to retrieve facilities. Please try again later.",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Only Administrators can create facilities
    const authResult = await validateApiAuth(["ADMIN"]);
    if ("response" in authResult) {
      return authResult.response;
    }

    const body = await req.json();
    const parsed = createFacilitySchema.safeParse(body);

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

    const facility = await Facility.create(parsed.data);

    return NextResponse.json(
      {
        status: "success",
        message: "Facility created successfully",
        data: facility,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/facilities error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to create facility. Please try again later.",
      },
      { status: 500 }
    );
  }
}

