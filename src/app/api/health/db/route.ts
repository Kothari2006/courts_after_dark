import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET() {
  try {
    await connectToDatabase();
    return NextResponse.json(
      {
        status: "success",
        database: "connected",
      },
      { status: 200 }
    );
  } catch (error) {
    // Log details server-side only; never expose connection errors publicly.
    console.error("[health] Database check failed:", error);
    return NextResponse.json(
      {
        status: "error",
        database: "disconnected",
      },
      { status: 503 }
    );
  }
}

