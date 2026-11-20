import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import User, { UserRole } from "@/models/User";
import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";

export interface AuthenticatedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  role: UserRole;
}

/**
 * Retrieves the current session user on the server.
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  try {
    const session = await auth();
    if (!session?.user) {
      return null;
    }
    return session.user as AuthenticatedUser;
  } catch {
    return null;
  }
}

/**
 * Enforces authentication in Server Components.
 * Redirects unauthenticated users to the login page.
 */
export async function requireAuth(callbackUrl?: string): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  if (!user) {
    const redirectUrl = callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/login";
    redirect(redirectUrl);
  }

  if (user.id) {
    try {
      await connectToDatabase();
      const userDoc = await User.findById(user.id).select("isActive role");
      if (userDoc) {
        if (!userDoc.isActive) {
          redirect("/login?error=AccountDeactivated");
        }
        user.role = userDoc.role;
      }
    } catch (err: unknown) {
      if (
        err &&
        typeof err === "object" &&
        "digest" in err &&
        typeof (err as { digest: string }).digest === "string" &&
        (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")
      ) {
        throw err;
      }
    }
  }

  return user;
}

/**
 * Enforces role-based authorization in Server Components.
 * If user does not have an allowed role, redirects to /unauthorized or their dashboard.
 */
export async function requireRole(
  allowedRoles: UserRole[],
  callbackUrl?: string
): Promise<AuthenticatedUser> {
  const user = await requireAuth(callbackUrl);
  if (!allowedRoles.includes(user.role)) {
    redirect("/unauthorized");
  }
  return user;
}

/**
 * Helper to validate authentication and role in API Route handlers.
 * Returns either the authenticated user or an appropriate error NextResponse.
 */
export async function validateApiAuth(
  allowedRoles?: UserRole[]
): Promise<{ user: AuthenticatedUser } | { response: NextResponse }> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      response: NextResponse.json(
        {
          status: "error",
          message: "Authentication required to access this resource",
        },
        { status: 401 }
      ),
    };
  }

  if (user.id) {
    try {
      await connectToDatabase();
      const userDoc = await User.findById(user.id).select("isActive role");
      if (userDoc) {
        if (!userDoc.isActive) {
          return {
            response: NextResponse.json(
              {
                status: "error",
                message: "Account has been deactivated. Access denied.",
              },
              { status: 403 }
            ),
          };
        }
        user.role = userDoc.role;
      }
    } catch {
      // In isolated environments, proceed with session user
    }
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return {
      response: NextResponse.json(
        {
          status: "error",
          message: "Forbidden: You do not have permission to perform this action",
        },
        { status: 403 }
      ),
    };
  }

  return { user };
}

export function isStudent(user: AuthenticatedUser): boolean {
  return user.role === "STUDENT";
}

export function isTeacher(user: AuthenticatedUser): boolean {
  return user.role === "TEACHER";
}

export function isAdmin(user: AuthenticatedUser): boolean {
  return user.role === "ADMIN";
}

export function isEquipmentManager(user: AuthenticatedUser): boolean {
  return user.role === "EQUIPMENT_MANAGER";
}

