"use client";

import { useSession } from "next-auth/react";
import DashboardLayout from "./DashboardLayout";
import TeacherDashboardLayout from "./TeacherDashboardLayout";

/**
 * Wraps a page that is shared between roles in the matching dashboard shell:
 * teachers get the purple faculty portal, everyone else the lime student shell.
 * Inside the student shell, purple/indigo utility colors are remapped to lime
 * (see `.theme-lime` in globals.css) so shared pages look consistent.
 */
export default function RoleLayout({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  const { data: session } = useSession();

  if (session?.user?.role === "TEACHER") {
    return <TeacherDashboardLayout title={title}>{children}</TeacherDashboardLayout>;
  }
  return (
    <DashboardLayout title={title}>
      <div className="theme-lime">{children}</div>
    </DashboardLayout>
  );
}
