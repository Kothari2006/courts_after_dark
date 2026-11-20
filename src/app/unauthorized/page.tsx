import Navbar from "@/components/Navbar";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth-utils";

export default async function UnauthorizedPage() {
  const user = await getCurrentUser();

  const getDashboardHref = () => {
    if (!user) return "/login";
    if (user.role === "ADMIN") return "/admin/dashboard";
    if (user.role === "EQUIPMENT_MANAGER") return "/equipment-manager/dashboard";
    return "/dashboard";
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mx-auto flex items-center justify-center text-3xl mb-4">
            🚫
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mb-2">
            Access Restricted
          </h1>
          <p className="text-sm text-zinc-400 mb-6">
            You do not have the required permissions to view this page. This area is restricted to authorized roles.
          </p>

          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400 mb-6 flex justify-between items-center">
            <span>Your current role:</span>
            <span className="font-semibold text-zinc-200 uppercase px-2 py-0.5 rounded bg-zinc-800">
              {user?.role || "GUEST"}
            </span>
          </div>

          <Link
            href={getDashboardHref()}
            className="inline-flex w-full justify-center items-center py-2.5 px-4 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-colors shadow-lg shadow-emerald-500/20"
          >
            Return to Authorized Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}

