import { requireRole } from "@/lib/auth-utils";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import TeacherDashboardLayout from "@/components/dashboard/TeacherDashboardLayout";
import ProfileCard from "@/components/dashboard/ProfileCard";

export default async function ProfilePage() {
  const user = await requireRole(["STUDENT", "TEACHER", "ADMIN", "EQUIPMENT_MANAGER"], "/profile");
  const isTeacher = user.role === "TEACHER";

  const content = (
    <div className={`max-w-4xl space-y-6 ${isTeacher ? "theme-purple" : ""}`}>
      <div>
        <h2 className="text-2xl font-black text-white">
          {isTeacher ? "Faculty Account & Preferences" : "Student Account & Preferences"}
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Manage your personal profile, review institutional booking allowances, and view registered verification details.
        </p>
      </div>

      <ProfileCard user={user} />
    </div>
  );

  if (isTeacher) {
    return (
      <TeacherDashboardLayout title="My Profile" activeTab="profile">
        {content}
      </TeacherDashboardLayout>
    );
  }

  return <DashboardLayout title="My Profile">{content}</DashboardLayout>;
}
