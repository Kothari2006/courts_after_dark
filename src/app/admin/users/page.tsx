import Navbar from "@/components/Navbar";
import { requireRole } from "@/lib/auth-utils";
import { listUsers } from "@/services/user.service";
import UserManagementClient from "./UserManagementClient";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  await requireRole(["ADMIN"], "/admin/users");

  const initialData = await listUsers({
    page: 1,
    limit: 10,
    role: "ALL",
    status: "ALL",
    sort: "desc",
    search: "",
  });

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <UserManagementClient initialData={initialData} />
      </main>
    </div>
  );
}
