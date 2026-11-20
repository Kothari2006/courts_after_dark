import { requireAuth } from "@/lib/auth-utils";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await requireAuth();

  if (user.role === "ADMIN") {
    redirect("/admin/dashboard");
  } else if (user.role === "EQUIPMENT_MANAGER") {
    redirect("/equipment-manager/dashboard");
  } else if (user.role === "TEACHER") {
    redirect("/teacher/dashboard");
  } else {
    redirect("/student/dashboard");
  }
}
