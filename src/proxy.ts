import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;
  const pathname = nextUrl.pathname;

  const isAuthRoute = pathname === "/login" || pathname === "/register";
  const isAdminRoute = pathname.startsWith("/admin");
  const isEquipmentManagerRoute = pathname.startsWith("/equipment-manager");
  const isTeacherRoute = pathname.startsWith("/teacher");
  const isStudentRoute =
    pathname.startsWith("/student") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/facilities") ||
    pathname.startsWith("/bookings") ||
    pathname.startsWith("/equipment") ||
    pathname.startsWith("/profile");

  const getRoleDashboard = (role?: string) => {
    switch (role) {
      case "ADMIN":
        return "/admin/dashboard";
      case "EQUIPMENT_MANAGER":
        return "/equipment-manager/dashboard";
      case "TEACHER":
        return "/teacher/dashboard";
      case "STUDENT":
      default:
        return "/student/dashboard";
    }
  };

  // Redirect authenticated users away from login/register pages
  if (isAuthRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL(getRoleDashboard(userRole), nextUrl));
    }
    return NextResponse.next();
  }

  // Redirect legacy /dashboard to role-specific dashboard
  if (pathname === "/dashboard" || pathname === "/dashboard/") {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login?callbackUrl=/dashboard", nextUrl));
    }
    return NextResponse.redirect(new URL(getRoleDashboard(userRole), nextUrl));
  }

  // Check if unauthenticated users are accessing any protected routes
  const isProtected =
    isAdminRoute || isEquipmentManagerRoute || isTeacherRoute || isStudentRoute;
  if (isProtected && !isLoggedIn) {
    const callbackUrl = encodeURIComponent(nextUrl.pathname + nextUrl.search);
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${callbackUrl}`, nextUrl)
    );
  }

  // Role authorization guards
  if (isAdminRoute && userRole !== "ADMIN") {
    return NextResponse.redirect(new URL("/unauthorized", nextUrl));
  }

  if (
    isEquipmentManagerRoute &&
    userRole !== "EQUIPMENT_MANAGER" &&
    userRole !== "ADMIN"
  ) {
    return NextResponse.redirect(new URL("/unauthorized", nextUrl));
  }

  if (isTeacherRoute && userRole !== "TEACHER" && userRole !== "ADMIN") {
    return NextResponse.redirect(new URL("/unauthorized", nextUrl));
  }

  if (pathname.startsWith("/student") && userRole !== "STUDENT" && userRole !== "ADMIN") {
    return NextResponse.redirect(new URL(getRoleDashboard(userRole), nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/student/:path*",
    "/teacher/:path*",
    "/facilities/:path*",
    "/bookings/:path*",
    "/equipment/:path*",
    "/profile/:path*",
    "/admin/:path*",
    "/equipment-manager/:path*",
    "/login",
    "/register",
  ],
};
