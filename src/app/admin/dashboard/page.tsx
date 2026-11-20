import Navbar from "@/components/Navbar";
import { requireRole } from "@/lib/auth-utils";
import { getAdminAnalytics } from "@/services/analytics.service";
import AdminDashboardClient from "./AdminDashboardClient";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const user = await requireRole(["ADMIN"]);

  // Serialize so Mongo ObjectIds/Dates become plain values for the client component.
  const initialData = JSON.parse(JSON.stringify(await getAdminAnalytics({ period: "30d" })));

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminDashboardClient
          initialData={initialData}
          userEmail={user.email || "admin@courtsafterdark.com"}
        />
      </main>
    </div>
  );
}
