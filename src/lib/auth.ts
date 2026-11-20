import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import connectToDatabase from "@/lib/mongodb";
import User, { UserRole } from "@/models/User";
import { loginSchema } from "@/lib/validations/auth";
import { authConfig } from "@/lib/auth.config";

// Fail loudly (once, at boot) instead of surfacing an opaque Auth.js "MissingSecret" later.
if (
  process.env.NODE_ENV === "production" &&
  process.env.NEXT_PHASE !== "phase-production-build" &&
  !process.env.AUTH_SECRET &&
  !process.env.NEXTAUTH_SECRET
) {
  console.error(
    "[env] Missing AUTH_SECRET. Set it in your hosting environment variables (generate with `openssl rand -base64 32`). See .env.example."
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsedCredentials = loginSchema.safeParse(credentials);

        if (!parsedCredentials.success) {
          return null;
        }

        const { email, password } = parsedCredentials.data;

        await connectToDatabase();

        const user = await User.findOne({ email });

        if (!user || !user.password) {
          return null;
        }

        if (!user.isActive) {
          throw new Error("ACCOUNT_INACTIVE");
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role as UserRole,
        };
      },
    }),
  ],
});

