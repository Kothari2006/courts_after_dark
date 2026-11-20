import Navbar from "@/components/Navbar";
import { requireRole } from "@/lib/auth-utils";
import Link from "next/link";
import { getInventoryStats } from "@/services/equipment.service";
import {
  Package,
  Clock,
  AlertTriangle,
  RotateCcw,
  Inbox,
  ArrowRight,
} from "lucide-react";

export default async function EquipmentManagerDashboardPage() {
  const user = await requireRole(["EQUIPMENT_MANAGER", "ADMIN"]);
  const stats = await getInventoryStats();

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* EM Header */}
        <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-cyan-950/40 border border-cyan-500/20 rounded-3xl p-6 sm:p-8 mb-8 relative overflow-hidden shadow-2xl">
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  Equipment Desk
                </span>
                <span className="text-xs text-zinc-400">• Inventory Operations</span>
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight">
                Equipment Control Panel
              </h1>
              <p className="text-sm text-zinc-400 mt-1 max-w-xl">
                Issue sports gear to students, track overdue returns, inspect damaged inventory, and update stock counts.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-400">Desk Staff:</span>
              <span className="text-xs font-semibold text-cyan-400 bg-cyan-500/10 px-3 py-1.5 rounded-lg border border-cyan-500/20">
                {user.email}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Total Catalog Items
              </span>
              <Package className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="mt-2 text-3xl font-extrabold text-white">
              {stats.totalCatalogCount}
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              {stats.totalItems} total physical units ({stats.availableItems} available)
            </p>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Currently Checked Out
              </span>
              <Clock className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="mt-2 text-3xl font-extrabold text-cyan-400">
              {stats.activeCheckoutsCount}
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              {stats.issuedItems} total units with students
            </p>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Overdue Returns
              </span>
              <AlertTriangle className="h-4 w-4 text-rose-400" />
            </div>
            <div className="mt-2 text-3xl font-extrabold text-rose-400">
              {stats.overdueCount}
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Past expected return deadline
            </p>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Damaged / In Repair
              </span>
              <RotateCcw className="h-4 w-4 text-amber-400" />
            </div>
            <div className="mt-2 text-3xl font-extrabold text-amber-400">
              {stats.damagedItems}
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Units isolated for inspection/repair
            </p>
          </div>
        </div>

        {/* Pending Requests Banner if any */}
        {stats.pendingRequestsCount > 0 && (
          <div className="mb-8 p-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Inbox className="h-5 w-5 text-amber-400" />
              <div>
                <h4 className="text-sm font-bold text-amber-300">
                  {stats.pendingRequestsCount} Student Request{stats.pendingRequestsCount > 1 ? "s" : ""} Pending Issue
                </h4>
                <p className="text-xs text-zinc-400">
                  Students have requested equipment for upcoming court reservations. Hand out gear at the desk.
                </p>
              </div>
            </div>
            <Link
              href="/equipment-manager/checkouts?tab=REQUESTED"
              className="px-4 py-2 text-xs font-bold bg-amber-400 text-zinc-950 rounded-xl hover:bg-amber-300 transition-colors inline-flex items-center gap-1.5"
            >
              Review Requests <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}

        {/* Operational Modules */}
        <h2 className="text-lg font-bold text-white mb-4">Desk Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Link
            href="/equipment-manager/inventory"
            className="group bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-800 hover:border-cyan-500/50 rounded-2xl p-6 transition-all"
          >
            <div className="text-3xl mb-3">📦</div>
            <h3 className="font-bold text-white group-hover:text-cyan-400 transition-colors">
              Inventory Catalog
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Audit equipment stock levels, adjust available and damaged counts, register new items, and toggle availability.
            </p>
          </Link>

          <Link
            href="/equipment-manager/checkouts"
            className="group bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-800 hover:border-cyan-500/50 rounded-2xl p-6 transition-all"
          >
            <div className="text-3xl mb-3">🔄</div>
            <h3 className="font-bold text-white group-hover:text-cyan-400 transition-colors">
              Checkouts & Returns
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Issue equipment for active court bookings, process student returns, assess item condition, and flag damages.
            </p>
          </Link>
        </div>
      </main>
    </div>
  );
}
