import { NextRequest, NextResponse } from "next/server";
import { publicErrorMessage } from "@/lib/api-errors";
import { validateApiAuth } from "@/lib/auth-utils";
import { listUsersQuerySchema } from "@/lib/validations/user";
import { listUsers } from "@/services/user.service";

// GET /api/admin/users - List users with search, filtering, pagination (Admin only)
export async function GET(req: NextRequest) {
  try {
    const authResult = await validateApiAuth(["ADMIN"]);
    if ("response" in authResult) {
      return authResult.response;
    }

    const { searchParams } = new URL(req.url);
    const rawSearch = searchParams.get("search") || undefined;
    const rawRole = searchParams.get("role") || undefined;
    const rawStatus = searchParams.get("status") || undefined;
    const rawPage = searchParams.get("page") || undefined;
    const rawLimit = searchParams.get("limit") || undefined;
    const rawSort = searchParams.get("sort") || undefined;

    const parseResult = listUsersQuerySchema.safeParse({
      search: rawSearch,
      role: rawRole,
      status: rawStatus,
      page: rawPage,
      limit: rawLimit,
      sort: rawSort,
    });

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

    const result = await listUsers(parseResult.data);

    return NextResponse.json({
      status: "success",
      ...result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ status: "error", message: publicErrorMessage(message) }, { status: 500 });
  }
}

