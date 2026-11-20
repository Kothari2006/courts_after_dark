"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import {
  Wrench,
  Plus,
  Filter,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  X,
  ArrowLeft,
  Edit2,
  Check,
  AlertCircle,
  Building,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FacilityOption {
  _id: string;
  name: string;
  sportType: string;
  location?: string;
}

interface ConflictingBooking {
  _id: string;
  startAt: string;
  endAt: string;
  startTime: string;
  endTime: string;
  bookingType: string;
  user: {
    _id: string;
    name?: string;
    email: string;
  };
}

interface MaintenanceRecord {
  _id: string;
  facility: {
    _id: string;
    name: string;
    sportType: string;
    location?: string;
  };
  startAt: string;
  endAt: string;
  reason: string;
  notes?: string;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  createdBy: {
    _id: string;
    name?: string;
    email: string;
  };
  cancelledBy?: {
    _id: string;
    name?: string;
    email: string;
  };
  cancelledAt?: string;
  cancellationReason?: string;
  completedBy?: {
    _id: string;
    name?: string;
    email: string;
  };
  completedAt?: string;
  createdAt: string;
}

interface MaintenanceStats {
  totalSchedules: number;
  scheduledCount: number;
  inProgressCount: number;
  completedCount: number;
  cancelledCount: number;
  facilitiesUnderMaintenanceCount: number;
}

export default function AdminMaintenancePage() {
  const [schedules, setSchedules] = useState<MaintenanceRecord[]>([]);
  const [facilities, setFacilities] = useState<FacilityOption[]>([]);
  const [stats, setStats] = useState<MaintenanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Filters
  const [selectedFacility, setSelectedFacility] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Action Banners
  const [actionAlert, setActionAlert] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Schedule Modal
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [modalFacilityId, setModalFacilityId] = useState("");
  const [modalStartAt, setModalStartAt] = useState("");
  const [modalEndAt, setModalEndAt] = useState("");
  const [modalReason, setModalReason] = useState("");
  const [modalNotes, setModalNotes] = useState("");
  const [modalStatus, setModalStatus] = useState<"SCHEDULED" | "IN_PROGRESS">("SCHEDULED");
  const [schedulingLoading, setSchedulingLoading] = useState(false);
  const [schedulingError, setSchedulingError] = useState<string | null>(null);
  const [conflictingBookings, setConflictingBookings] = useState<ConflictingBooking[]>([]);

  // Edit Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<MaintenanceRecord | null>(null);
  const [editStartAt, setEditStartAt] = useState("");
  const [editEndAt, setEditEndAt] = useState("");
  const [editReason, setEditReason] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editStatus, setEditStatus] = useState<"SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED">("SCHEDULED");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Cancel Modal
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancellingSchedule, setCancellingSchedule] = useState<MaintenanceRecord | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Complete Modal
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [completingSchedule, setCompletingSchedule] = useState<MaintenanceRecord | null>(null);
  const [completeNotes, setCompleteNotes] = useState("");
  const [completeLoading, setCompleteLoading] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const queryParams = new URLSearchParams();
        if (selectedFacility !== "ALL") queryParams.set("facilityId", selectedFacility);
        if (selectedStatus !== "ALL") queryParams.set("status", selectedStatus);
        if (fromDate) queryParams.set("from", new Date(fromDate).toISOString());
        if (toDate) queryParams.set("to", new Date(toDate).toISOString());
        queryParams.set("limit", "100");

        const [schedulesRes, facilitiesRes, statsRes] = await Promise.all([
          fetch(`/api/maintenance?${queryParams.toString()}`),
          fetch("/api/facilities?limit=100"),
          fetch("/api/maintenance/stats"),
        ]);

        if (!schedulesRes.ok) throw new Error("Failed to load maintenance schedules");

        const schedulesData = await schedulesRes.json();
        const facilitiesData = facilitiesRes.ok ? await facilitiesRes.json() : { facilities: [] };
        const statsData = statsRes.ok ? await statsRes.json() : { stats: null };

        if (isMounted) {
          setSchedules(schedulesData.items || []);
          setFacilities(facilitiesData.facilities || []);
          setStats(statsData.stats || null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Error loading maintenance data");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [selectedFacility, selectedStatus, fromDate, toDate, refreshTrigger]);

  const handleOpenScheduleModal = () => {
    setModalFacilityId(facilities[0]?._id || "");
    const now = new Date();
    const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
    const inThreeHours = new Date(now.getTime() + 3 * 60 * 60 * 1000);

    const formatInputDate = (d: Date) => {
      const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
      return local.toISOString().slice(0, 16);
    };

    setModalStartAt(formatInputDate(inOneHour));
    setModalEndAt(formatInputDate(inThreeHours));
    setModalReason("");
    setModalNotes("");
    setModalStatus("SCHEDULED");
    setSchedulingError(null);
    setConflictingBookings([]);
    setScheduleModalOpen(true);
  };

  const handleCreateMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalFacilityId || !modalStartAt || !modalEndAt || !modalReason.trim()) {
      setSchedulingError("Please fill out all required fields.");
      return;
    }

    try {
      setSchedulingLoading(true);
      setSchedulingError(null);
      setConflictingBookings([]);

      const res = await fetch("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          facilityId: modalFacilityId,
          startAt: new Date(modalStartAt).toISOString(),
          endAt: new Date(modalEndAt).toISOString(),
          reason: modalReason.trim(),
          notes: modalNotes.trim() || undefined,
          status: modalStatus,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === "BOOKING_CONFLICT") {
          setConflictingBookings(data.conflictingBookings || []);
          throw new Error(data.message || "Conflicting student bookings exist.");
        }
        throw new Error(data.message || "Failed to schedule maintenance.");
      }

      setScheduleModalOpen(false);
      setActionAlert({
        type: "success",
        text: "Maintenance scheduled successfully. Affected slots are now blocked.",
      });
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      setSchedulingError(err instanceof Error ? err.message : "Error scheduling maintenance");
    } finally {
      setSchedulingLoading(false);
    }
  };

  const handleOpenEditModal = (rec: MaintenanceRecord) => {
    setEditingSchedule(rec);
    const formatInputDate = (dStr: string) => {
      const d = new Date(dStr);
      const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
      return local.toISOString().slice(0, 16);
    };
    setEditStartAt(formatInputDate(rec.startAt));
    setEditEndAt(formatInputDate(rec.endAt));
    setEditReason(rec.reason);
    setEditNotes(rec.notes || "");
    setEditStatus(rec.status);
    setEditError(null);
    setEditModalOpen(true);
  };

  const handleUpdateMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchedule) return;

    try {
      setEditLoading(true);
      setEditError(null);

      const res = await fetch(`/api/maintenance/${editingSchedule._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startAt: new Date(editStartAt).toISOString(),
          endAt: new Date(editEndAt).toISOString(),
          reason: editReason.trim(),
          notes: editNotes.trim() || undefined,
          status: editStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update maintenance schedule.");

      setEditModalOpen(false);
      setEditingSchedule(null);
      setActionAlert({
        type: "success",
        text: "Maintenance schedule updated successfully.",
      });
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Error updating maintenance");
    } finally {
      setEditLoading(false);
    }
  };

  const handleOpenCancelModal = (rec: MaintenanceRecord) => {
    setCancellingSchedule(rec);
    setCancelReason("");
    setCancelError(null);
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingSchedule) return;

    try {
      setCancelLoading(true);
      setCancelError(null);

      const res = await fetch(`/api/maintenance/${cancellingSchedule._id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to cancel maintenance.");

      setCancelModalOpen(false);
      setCancellingSchedule(null);
      setActionAlert({
        type: "success",
        text: "Maintenance cancelled. Time slots restored for student booking.",
      });
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : "Error cancelling maintenance");
    } finally {
      setCancelLoading(false);
    }
  };

  const handleOpenCompleteModal = (rec: MaintenanceRecord) => {
    setCompletingSchedule(rec);
    setCompleteNotes(rec.notes || "");
    setCompleteError(null);
    setCompleteModalOpen(true);
  };

  const handleConfirmComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingSchedule) return;

    try {
      setCompleteLoading(true);
      setCompleteError(null);

      const res = await fetch(`/api/maintenance/${completingSchedule._id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: completeNotes.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to mark maintenance as completed.");

      setCompleteModalOpen(false);
      setCompletingSchedule(null);
      setActionAlert({
        type: "success",
        text: "Maintenance marked as completed successfully.",
      });
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      setCompleteError(err instanceof Error ? err.message : "Error completing maintenance");
    } finally {
      setCompleteLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-amber-400 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Admin Console
          </Link>

          <button
            onClick={handleOpenScheduleModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs rounded-xl transition-colors shadow-lg shadow-amber-400/20 cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Schedule Maintenance
          </button>
        </div>

        {/* Page Title */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
              Operations & Facility Health
            </span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Facility Maintenance Management
          </h1>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
            Schedule court closures for cleaning, repairs, or re-surfacing. Synchronizes in real time with the availability engine to prevent double-booking.
          </p>
        </div>

        {/* Stats Summary Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Total Schedules
              </span>
              <div className="mt-2 text-2xl font-extrabold text-white">
                {stats.totalSchedules}
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">Across all sports courts</p>
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
              <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                Scheduled
              </span>
              <div className="mt-2 text-2xl font-extrabold text-cyan-400">
                {stats.scheduledCount}
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">Planned upcoming work</p>
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                In Progress
              </span>
              <div className="mt-2 text-2xl font-extrabold text-amber-400">
                {stats.inProgressCount}
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">Currently undergoing work</p>
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                Completed
              </span>
              <div className="mt-2 text-2xl font-extrabold text-emerald-400">
                {stats.completedCount}
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">Finished & restocked</p>
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 col-span-2 sm:col-span-1">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Cancelled
              </span>
              <div className="mt-2 text-2xl font-extrabold text-zinc-400">
                {stats.cancelledCount}
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">Preserved audit logs</p>
            </div>
          </div>
        )}

        {/* Global Action Alert */}
        {actionAlert && (
          <div
            className={cn(
              "mb-6 p-4 rounded-2xl flex items-center justify-between text-xs font-semibold",
              actionAlert.type === "success"
                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                : "bg-rose-500/10 border border-rose-500/20 text-rose-400"
            )}
          >
            <div className="flex items-center gap-2">
              {actionAlert.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              <span>{actionAlert.text}</span>
            </div>
            <button
              onClick={() => setActionAlert(null)}
              className="text-zinc-500 hover:text-zinc-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Filter Toolbar */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-zinc-500 shrink-0" />
              <select
                value={selectedFacility}
                onChange={(e) => setSelectedFacility(e.target.value)}
                className="bg-zinc-900 border border-zinc-700 text-xs rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
              >
                <option value="ALL">All Facilities</option>
                {facilities.map((f) => (
                  <option key={f._id} value={f._id}>
                    {f.name} ({f.sportType})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-zinc-500 shrink-0" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-zinc-900 border border-zinc-700 text-xs rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
              >
                <option value="ALL">All Statuses</option>
                <option value="SCHEDULED">SCHEDULED</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs text-zinc-500">From:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 text-xs rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-amber-400"
            />
            <span className="text-xs text-zinc-500">To:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 text-xs rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-amber-400"
            />
            {(fromDate || toDate || selectedFacility !== "ALL" || selectedStatus !== "ALL") && (
              <button
                onClick={() => {
                  setSelectedFacility("ALL");
                  setSelectedStatus("ALL");
                  setFromDate("");
                  setToDate("");
                }}
                className="text-xs text-amber-400 hover:underline px-2 py-1"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Maintenance Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16 text-zinc-500">
            <Loader2 className="h-8 w-8 animate-spin text-amber-400 mb-3" />
            <p className="text-sm">Loading maintenance schedules...</p>
          </div>
        ) : error ? (
          <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : schedules.length === 0 ? (
          <div className="p-16 border border-dashed border-zinc-800 rounded-3xl text-center text-zinc-500">
            <Wrench className="h-10 w-10 mx-auto mb-3 opacity-40 text-amber-400" />
            <p className="text-sm font-semibold text-zinc-300">No maintenance schedules found</p>
            <p className="text-xs text-zinc-500 mt-1">
              Facilities are operational or no maintenance matches the active filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/40 shadow-xl">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-900 uppercase tracking-wider text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="px-5 py-3.5">Facility</th>
                  <th className="px-5 py-3.5">Scheduled Interval</th>
                  <th className="px-5 py-3.5">Reason & Scope</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Created By</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {schedules.map((rec) => {
                  const isTerminal = rec.status === "COMPLETED" || rec.status === "CANCELLED";

                  return (
                    <tr key={rec._id} className="hover:bg-zinc-900/60 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-white text-sm">
                          {rec.facility?.name}
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          {rec.facility?.sportType} • {rec.facility?.location || "Main Campus"}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-amber-400" />
                          <span>
                            {new Date(rec.startAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}{" "}
                            {new Date(rec.startAt).toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-400 mt-0.5">
                          until{" "}
                          {new Date(rec.endAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          {new Date(rec.endAt).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>

                      <td className="px-5 py-4 max-w-xs">
                        <div className="font-semibold text-white">{rec.reason}</div>
                        {rec.notes && (
                          <div className="text-[11px] text-zinc-500 truncate mt-0.5">
                            Note: {rec.notes}
                          </div>
                        )}
                        {rec.cancellationReason && (
                          <div className="text-[11px] text-rose-400 mt-0.5">
                            Cancelled: {rec.cancellationReason}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={cn(
                            "px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase border",
                            rec.status === "IN_PROGRESS"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse"
                              : rec.status === "SCHEDULED"
                              ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                              : rec.status === "COMPLETED"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : "bg-zinc-800 text-zinc-500 border-zinc-700"
                          )}
                        >
                          {rec.status}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="text-zinc-300 font-mono text-[11px]">
                          {rec.createdBy?.email || "Admin"}
                        </div>
                        {rec.completedBy && (
                          <div className="text-[10px] text-emerald-400">
                            Completed by: {rec.completedBy.email}
                          </div>
                        )}
                        {rec.cancelledBy && (
                          <div className="text-[10px] text-zinc-500">
                            Cancelled by: {rec.cancelledBy.email}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          {!isTerminal && (
                            <>
                              <button
                                onClick={() => handleOpenEditModal(rec)}
                                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                                title="Edit Maintenance Window"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>

                              <button
                                onClick={() => handleOpenCompleteModal(rec)}
                                className="p-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 text-emerald-400 transition-colors cursor-pointer border border-emerald-500/20"
                                title="Mark as Completed"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>

                              <button
                                onClick={() => handleOpenCancelModal(rec)}
                                className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-400 transition-colors cursor-pointer border border-rose-500/20"
                                title="Cancel Maintenance"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}

                          {isTerminal && (
                            <span className="text-[11px] text-zinc-500">
                              {rec.status === "COMPLETED" ? "Resolved" : "Archived"}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Schedule Maintenance Modal */}
        {scheduleModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-lg rounded-3xl border border-zinc-800 bg-zinc-900 p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setScheduleModalOpen(false)}
                className="absolute top-6 right-6 text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
                <Wrench className="h-4 w-4" /> Court Closure Scheduling
              </div>
              <h3 className="text-xl font-black text-white">Schedule Facility Maintenance</h3>
              <p className="text-xs text-zinc-400 mt-1 mb-5">
                Blocked slots will be marked as MAINTENANCE on student booking calendars.
              </p>

              <form onSubmit={handleCreateMaintenance} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Target Facility *
                  </label>
                  <select
                    value={modalFacilityId}
                    onChange={(e) => setModalFacilityId(e.target.value)}
                    required
                    className="w-full rounded-xl bg-zinc-950 border border-zinc-700 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    {facilities.map((f) => (
                      <option key={f._id} value={f._id}>
                        {f.name} ({f.sportType})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">
                      Maintenance Start *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={modalStartAt}
                      onChange={(e) => setModalStartAt(e.target.value)}
                      className="w-full rounded-xl bg-zinc-950 border border-zinc-700 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">
                      Maintenance End *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={modalEndAt}
                      onChange={(e) => setModalEndAt(e.target.value)}
                      className="w-full rounded-xl bg-zinc-950 border border-zinc-700 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Reason for Closure *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Synthetic mat polishing & net tension adjustment"
                    value={modalReason}
                    onChange={(e) => setModalReason(e.target.value)}
                    className="w-full rounded-xl bg-zinc-950 border border-zinc-700 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Internal Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Vendor contact, contractor details, parts on order..."
                    value={modalNotes}
                    onChange={(e) => setModalNotes(e.target.value)}
                    className="w-full rounded-xl bg-zinc-950 border border-zinc-700 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Initial Status
                  </label>
                  <select
                    value={modalStatus}
                    onChange={(e) => setModalStatus(e.target.value as "SCHEDULED" | "IN_PROGRESS")}
                    className="w-full rounded-xl bg-zinc-950 border border-zinc-700 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="SCHEDULED">SCHEDULED (Upcoming work)</option>
                    <option value="IN_PROGRESS">IN_PROGRESS (Work underway now)</option>
                  </select>
                </div>

                {/* Error Banner */}
                {schedulingError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{schedulingError}</span>
                  </div>
                )}

                {/* Conflicting Bookings List if Conflict Detected */}
                {conflictingBookings.length > 0 && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                      <span>{conflictingBookings.length} Overlapping Student Reservation(s)</span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      To protect student reservations, maintenance cannot be scheduled over existing bookings without prior resolution.
                    </p>
                    <div className="mt-2 space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {conflictingBookings.map((b) => (
                        <div
                          key={b._id}
                          className="p-2 rounded-lg bg-zinc-950/80 border border-zinc-800 text-[11px] flex items-center justify-between"
                        >
                          <div>
                            <span className="font-semibold text-white">
                              {b.user?.name || "Student"} ({b.user?.email})
                            </span>
                            <div className="text-[10px] text-zinc-500">
                              {new Date(b.startAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}{" "}
                              • {b.startTime} - {b.endTime}
                            </div>
                          </div>
                          <span className="text-[10px] font-mono text-zinc-400">
                            {b.bookingType}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-3 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setScheduleModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={schedulingLoading}
                    className="px-5 py-2 text-xs font-bold bg-amber-400 hover:bg-amber-300 text-zinc-950 rounded-xl disabled:opacity-50 transition-colors shadow-lg shadow-amber-400/20 flex items-center gap-2"
                  >
                    {schedulingLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Scheduling...
                      </>
                    ) : (
                      "Confirm Schedule"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editModalOpen && editingSchedule && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-lg rounded-3xl border border-zinc-800 bg-zinc-900 p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setEditModalOpen(false)}
                className="absolute top-6 right-6 text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

              <h3 className="text-xl font-black text-white mb-1">
                Edit Maintenance: {editingSchedule.facility?.name}
              </h3>
              <p className="text-xs text-zinc-400 mb-5">
                Update planned maintenance time window or status.
              </p>

              <form onSubmit={handleUpdateMaintenance} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">
                      Start Time
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={editStartAt}
                      onChange={(e) => setEditStartAt(e.target.value)}
                      className="w-full rounded-xl bg-zinc-950 border border-zinc-700 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">
                      End Time
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={editEndAt}
                      onChange={(e) => setEditEndAt(e.target.value)}
                      className="w-full rounded-xl bg-zinc-950 border border-zinc-700 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Reason</label>
                  <input
                    type="text"
                    required
                    value={editReason}
                    onChange={(e) => setEditReason(e.target.value)}
                    className="w-full rounded-xl bg-zinc-950 border border-zinc-700 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) =>
                      setEditStatus(
                        e.target.value as "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
                      )
                    }
                    className="w-full rounded-xl bg-zinc-950 border border-zinc-700 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="SCHEDULED">SCHEDULED</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Internal Notes</label>
                  <textarea
                    rows={2}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full rounded-xl bg-zinc-950 border border-zinc-700 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                {editError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                    {editError}
                  </div>
                )}

                <div className="pt-3 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="px-5 py-2 text-xs font-bold bg-amber-400 hover:bg-amber-300 text-zinc-950 rounded-xl disabled:opacity-50 transition-colors shadow-lg shadow-amber-400/20 flex items-center gap-2"
                  >
                    {editLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Cancel Modal */}
        {cancelModalOpen && cancellingSchedule && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl relative">
              <button
                onClick={() => setCancelModalOpen(false)}
                className="absolute top-5 right-5 text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

              <h3 className="text-xl font-black text-white mb-1">Cancel Maintenance</h3>
              <p className="text-xs text-zinc-400 mb-4">
                Cancelling maintenance will immediately release blocked slots back into the availability calendar for student booking.
              </p>

              <form onSubmit={handleConfirmCancel} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Cancellation Reason (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Contractor rescheduled, emergency resolved"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full rounded-xl bg-zinc-950 border border-zinc-700 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                {cancelError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                    {cancelError}
                  </div>
                )}

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setCancelModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={cancelLoading}
                    className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl disabled:opacity-50 transition-colors shadow-lg shadow-rose-600/20 flex items-center gap-2"
                  >
                    {cancelLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Cancellation"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Complete Modal */}
        {completeModalOpen && completingSchedule && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl relative">
              <button
                onClick={() => setCompleteModalOpen(false)}
                className="absolute top-5 right-5 text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

              <h3 className="text-xl font-black text-white mb-1">Complete Maintenance</h3>
              <p className="text-xs text-zinc-400 mb-4">
                Record that maintenance work is finished and the court is ready for student use.
              </p>

              <form onSubmit={handleConfirmComplete} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Completion Notes / Inspection Sign-off
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Net tension tested, synthetic court clean, approved for tournament play"
                    value={completeNotes}
                    onChange={(e) => setCompleteNotes(e.target.value)}
                    className="w-full rounded-xl bg-zinc-950 border border-zinc-700 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                {completeError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                    {completeError}
                  </div>
                )}

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setCompleteModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={completeLoading}
                    className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl disabled:opacity-50 transition-colors shadow-lg shadow-emerald-600/20 flex items-center gap-2"
                  >
                    {completeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign Off & Complete"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
