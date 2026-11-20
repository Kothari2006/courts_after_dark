import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import { registerSchema } from "@/lib/validations/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      const issues = parsed.error.issues;
      const errorMessage = issues[0]?.message || "Invalid input data";
      return NextResponse.json(
        {
          status: "error",
          message: errorMessage,
          errors: issues,
        },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    await connectToDatabase();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        {
          status: "error",
          message: "An account with this email address already exists",
        },
        { status: 409 }
      );
    }

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const userRole = parsed.data.role === "TEACHER" ? "TEACHER" : "STUDENT";

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: userRole,
      isActive: true,
    });

    return NextResponse.json(
      {
        status: "success",
        message: "Registration successful. You can now log in.",
        user: {
          id: newUser._id.toString(),
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "An unexpected error occurred during registration. Please try again.",
      },
      { status: 500 }
    );
  }
}

