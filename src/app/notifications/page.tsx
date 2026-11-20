import { requireAuth } from "@/lib/auth-utils";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import TeacherDashboardLayout from "@/components/dashboard/TeacherDashboardLayout";
import NotificationsClient from "./NotificationsClient";

export default async function NotificationsPage() {
  const user = await requireAuth("/notifications");

  if (user.role === "TEACHER") {
    return (
      <TeacherDashboardLayout title="Notifications" activeTab="notifications">
        <NotificationsClient accent="purple" />
      </TeacherDashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Notifications">
      <NotificationsClient accent="lime" />
    </DashboardLayout>
  );
}
