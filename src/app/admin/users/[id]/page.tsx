import Navbar from "@/components/Navbar";
import { requireRole } from "@/lib/auth-utils";
import { getUserDetails } from "@/services/user.service";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Package,
  History,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface UserDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminUserDetailsPage({
  params,
}: UserDetailsPageProps) {
  await requireRole(["ADMIN"]);

  const { id } = await params;

  let details;
  try {
    details = await getUserDetails(id);
  } catch {
    notFound();
  }

  const { user, stats, recentBookings, recentCheckouts, auditHistory } = details;

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "EQUIPMENT_MANAGER":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/30";
      case "TEACHER":
        return "bg-purple-500/10 text-purple-400 border-purple-500/30";
      default:
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Breadcrumb Back */}
        <div>
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to User Directory
          </Link>
        </div>

        {/* Profile Card Header */}
        <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-amber-950/30 border border-zinc-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${getRoleBadge(
                    user.role
                  )}`}
                >
                  {user.role}
                </span>
                {user.isActive ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Active Account
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    Inactive / Deactivated
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight">
                {user.name}
              </h1>
              <div className="text-xs text-zinc-400 mt-2 flex items-center gap-4 flex-wrap">
                <span className="flex items-center gap-1 font-mono">
                  <Mail className="w-3.5 h-3.5 text-zinc-500" />
                  {user.email}
                </span>
                {user.phoneNumber && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-zinc-500" />
                    {user.phoneNumber}
                  </span>
                )}
                <span>
                  Member since: {new Date(user.createdAt).toLocaleDateString("en-US")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 text-center">
            <span className="text-xs text-zinc-400 uppercase font-semibold">
              Total Facility Bookings
            </span>
            <div className="text-3xl font-extrabold text-white mt-1">
              {stats.totalBookings}
            </div>
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 text-center">
            <span className="text-xs text-zinc-400 uppercase font-semibold">
              Total Equipment Checkouts
            </span>
            <div className="text-3xl font-extrabold text-cyan-400 mt-1">
              {stats.totalCheckouts}
            </div>
          </div>
        </div>

        {/* Recent Facility Reservations */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            Recent Facility Reservations
          </h2>
          <div className="space-y-3">
            {recentBookings.length > 0 ? (
              recentBookings.map((b) => (
                <div
                  key={b._id}
                  className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-semibold text-white">
                      {b.facilityName}{" "}
                      <span className="text-zinc-400 font-normal">
                        ({b.sportType})
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                      {new Date(b.startAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      –{" "}
                      {new Date(b.endAt).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-[10px] font-semibold ${
                      b.status === "CONFIRMED"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : b.status === "CANCELLED"
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        : "bg-zinc-800 text-zinc-300"
                    }`}
                  >
                    {b.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-zinc-500 text-xs">
                No reservation history recorded for this user
              </div>
            )}
          </div>
        </div>

        {/* Recent Equipment Checkouts */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Package className="w-4 h-4 text-cyan-400" />
            Recent Equipment Checkouts
          </h2>
          <div className="space-y-3">
            {recentCheckouts.length > 0 ? (
              recentCheckouts.map((c) => (
                <div
                  key={c._id}
                  className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-semibold text-white">
                      {c.equipmentNames}
                    </div>
                    <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                      Expected Return:{" "}
                      {new Date(c.expectedReturnAt).toLocaleDateString("en-US")}
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {c.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-zinc-500 text-xs">
                No equipment checkout history recorded
              </div>
            )}
          </div>
        </div>

        {/* Administrative & Security Audit Trail */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <History className="w-4 h-4 text-amber-400" />
            Security & Administrative Audit Trail
          </h2>
          <div className="space-y-3">
            {auditHistory.length > 0 ? (
              auditHistory.map((a) => (
                <div
                  key={a._id}
                  className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">
                      {a.actionType === "ROLE_CHANGE"
                        ? "Role Changed"
                        : "Status Changed"}
                      :{" "}
                      <span className="text-amber-400 font-mono">
                        {a.previousValue} → {a.newValue}
                      </span>
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {new Date(a.createdAt).toLocaleString("en-US")}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-1">
                    Admin: {a.adminName} ({a.adminEmail})
                    {a.reason && ` • Reason: "${a.reason}"`}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-zinc-500 text-xs">
                No administrative modifications recorded for this user
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
