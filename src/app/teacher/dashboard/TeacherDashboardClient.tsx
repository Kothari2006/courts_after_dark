"use client";

import { TeacherHero } from "@/components/illustrations/HeroIllustrations";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import TeacherDashboardLayout from "@/components/dashboard/TeacherDashboardLayout";
import {
  Trophy,
  Users,
  CheckSquare,
  Calendar,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  ChevronRight,
  ShieldAlert,
  Loader2,
  CalendarDays,
  Sparkles,
  RefreshCw,
  Eye,
  Info,
} from "lucide-react";

interface FacilityOption {
  _id: string;
  name: string;
  sportType: string;
  location: string;
  operatingHours?: { open: string; close: string };
  slotDuration?: number;
}

interface EquipmentOption {
  _id: string;
  name: string;
  category: string;
  status: string;
}

interface TeacherProps {
  teacher: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  initialFacilities: FacilityOption[];
  initialEquipment: EquipmentOption[];
}

export default function TeacherDashboardClient({
  teacher,
  initialFacilities,
  initialEquipment,
}: TeacherProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";

  const handleTabChange = (tab: string) => {
    router.push(`/teacher/dashboard?tab=${tab}`);
  };

  // ==========================================
  // TAB 1: OVERVIEW STATE
  // ==========================================
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch("/api/teacher/stats");
      const data = await res.json();
      if (res.ok) setStats(data.stats);
    } catch {
      // ignore
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "overview") fetchStats();
  }, [activeTab, fetchStats]);

  // ==========================================
  // TAB 2: SPORTS ACTIVITIES STATE
  // ==========================================
  const [activities, setActivities] = useState<any[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activitySearch, setActivitySearch] = useState("");
  const [activityFilterStatus, setActivityFilterStatus] = useState("ALL");
  const [activityFilterMine, setActivityFilterMine] = useState(false);
  const [showCreateActivityModal, setShowCreateActivityModal] = useState(false);
  const [activityFormError, setActivityFormError] = useState<string | null>(null);
  const [activitySubmitting, setActivitySubmitting] = useState(false);

  const [activityFormData, setActivityFormData] = useState({
    title: "",
    description: "",
    sportType: "BADMINTON",
    facilityId: initialFacilities[0]?._id || "",
    startDate: new Date().toISOString().split("T")[0],
    startTime: "18:00",
    endTime: "19:00",
    participantLimit: 20,
  });

  const fetchActivities = useCallback(async () => {
    setActivitiesLoading(true);
    try {
      const params = new URLSearchParams();
      if (activitySearch) params.set("search", activitySearch);
      if (activityFilterStatus !== "ALL") params.set("status", activityFilterStatus);
      if (activityFilterMine) params.set("mine", "true");

      const res = await fetch(`/api/activities?${params.toString()}`);
      const data = await res.json();
      if (res.ok) setActivities(data.activities || []);
    } catch {
      // ignore
    } finally {
      setActivitiesLoading(false);
    }
  }, [activitySearch, activityFilterStatus, activityFilterMine]);

  useEffect(() => {
    if (activeTab === "activities" || activeTab === "attendance") {
      fetchActivities();
    }
  }, [activeTab, fetchActivities]);

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    setActivityFormError(null);
    setActivitySubmitting(true);

    try {
      const startAt = new Date(`${activityFormData.startDate}T${activityFormData.startTime}:00Z`).toISOString();
      const endAt = new Date(`${activityFormData.startDate}T${activityFormData.endTime}:00Z`).toISOString();

      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: activityFormData.title,
          description: activityFormData.description,
          sportType: activityFormData.sportType,
          facilityId: activityFormData.facilityId,
          startAt,
          endAt,
          participantLimit: Number(activityFormData.participantLimit),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActivityFormError(data.message || "Failed to create activity");
        return;
      }

      setShowCreateActivityModal(false);
      setActivityFormData({
        title: "",
        description: "",
        sportType: "BADMINTON",
        facilityId: initialFacilities[0]?._id || "",
        startDate: new Date().toISOString().split("T")[0],
        startTime: "18:00",
        endTime: "19:00",
        participantLimit: 20,
      });
      fetchActivities();
    } catch {
      setActivityFormError("An unexpected network error occurred.");
    } finally {
      setActivitySubmitting(false);
    }
  };

  const handleCancelActivity = async (activityId: string) => {
    if (!confirm("Are you sure you want to cancel this activity?")) return;
    try {
      const res = await fetch(`/api/activities/${activityId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Cancelled by organizing faculty" }),
      });
      if (res.ok) {
        fetchActivities();
      } else {
        const data = await res.json();
        alert(data.message || "Could not cancel activity");
      }
    } catch {
      alert("Error connecting to server");
    }
  };

  // ==========================================
  // TAB 3: STUDENT BOOKINGS STATE (READ ONLY)
  // ==========================================
  const [studentBookings, setStudentBookings] = useState<any[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingSearch, setBookingSearch] = useState("");
  const [bookingFacilityFilter, setBookingFacilityFilter] = useState("");
  const [bookingStatusFilter, setBookingStatusFilter] = useState("ALL");
  const [selectedBookingDetails, setSelectedBookingDetails] = useState<any | null>(null);

  const fetchStudentBookings = useCallback(async () => {
    setBookingsLoading(true);
    try {
      const params = new URLSearchParams();
      if (bookingSearch) params.set("search", bookingSearch);
      if (bookingFacilityFilter) params.set("facilityId", bookingFacilityFilter);
      if (bookingStatusFilter !== "ALL") params.set("status", bookingStatusFilter);

      const res = await fetch(`/api/teacher/bookings?${params.toString()}`);
      const data = await res.json();
      if (res.ok) setStudentBookings(data.bookings || []);
    } catch {
      // ignore
    } finally {
      setBookingsLoading(false);
    }
  }, [bookingSearch, bookingFacilityFilter, bookingStatusFilter]);

  useEffect(() => {
    if (activeTab === "bookings") fetchStudentBookings();
  }, [activeTab, fetchStudentBookings]);

  // ==========================================
  // TAB 4: ATTENDANCE STATE
  // ==========================================
  const [selectedAttendanceActivityId, setSelectedAttendanceActivityId] = useState<string>("");
  const [attendanceParticipants, setAttendanceParticipants] = useState<any[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceSaving, setAttendanceSaving] = useState(false);
  const [attendanceSuccess, setAttendanceSuccess] = useState<string | null>(null);

  const fetchActivityAttendance = useCallback(async (activityId: string) => {
    if (!activityId) return;
    setAttendanceLoading(true);
    setAttendanceSuccess(null);
    try {
      const res = await fetch(`/api/activities/${activityId}/attendance`);
      const data = await res.json();
      if (res.ok) {
        setAttendanceParticipants(data.participants || []);
      } else {
        alert(data.message || "Failed to load attendance list");
      }
    } catch {
      // ignore
    } finally {
      setAttendanceLoading(false);
    }
  }, []);

  const handleUpdateParticipantStatus = (participantId: string, status: "REGISTERED" | "PRESENT" | "ABSENT") => {
    setAttendanceParticipants((prev) =>
      prev.map((p) => (p._id === participantId ? { ...p, attendanceStatus: status } : p))
    );
  };

  const handleSaveAttendance = async () => {
    if (!selectedAttendanceActivityId) return;
    setAttendanceSaving(true);
    setAttendanceSuccess(null);
    try {
      const records = attendanceParticipants.map((p) => ({
        participantId: p._id,
        status: p.attendanceStatus,
      }));

      const res = await fetch(`/api/activities/${selectedAttendanceActivityId}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records }),
      });

      const data = await res.json();
      if (res.ok) {
        setAttendanceSuccess("Attendance records saved successfully!");
      } else {
        alert(data.message || "Could not save attendance");
      }
    } catch {
      alert("Error saving attendance");
    } finally {
      setAttendanceSaving(false);
    }
  };

  // ==========================================
  // TAB 5: FACILITY SCHEDULE STATE (PRIVACY SAFE)
  // ==========================================
  const [scheduleFacilityId, setScheduleFacilityId] = useState(initialFacilities[0]?._id || "");
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split("T")[0]);
  const [scheduleData, setScheduleData] = useState<any | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  const fetchFacilitySchedule = useCallback(async () => {
    if (!scheduleFacilityId) return;
    setScheduleLoading(true);
    try {
      const res = await fetch(
        `/api/teacher/schedule?facilityId=${scheduleFacilityId}&date=${scheduleDate}`
      );
      const data = await res.json();
      if (res.ok) setScheduleData(data.schedule);
    } catch {
      // ignore
    } finally {
      setScheduleLoading(false);
    }
  }, [scheduleFacilityId, scheduleDate]);

  useEffect(() => {
    if (activeTab === "schedule") fetchFacilitySchedule();
  }, [activeTab, fetchFacilitySchedule]);

  // ==========================================
  // TAB 6: DAMAGE / MAINTENANCE REPORTS STATE
  // ==========================================
  const [teacherReports, setTeacherReports] = useState<any[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [showCreateReportModal, setShowCreateReportModal] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const [reportFormData, setReportFormData] = useState({
    type: "FACILITY" as "FACILITY" | "EQUIPMENT",
    facilityId: initialFacilities[0]?._id || "",
    equipmentId: initialEquipment[0]?._id || "",
    title: "",
    description: "",
    severity: "MEDIUM" as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  });

  const fetchReports = useCallback(async () => {
    setReportsLoading(true);
    try {
      const res = await fetch("/api/teacher/reports");
      const data = await res.json();
      if (res.ok) setTeacherReports(data.reports || []);
    } catch {
      // ignore
    } finally {
      setReportsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "maintenance") fetchReports();
  }, [activeTab, fetchReports]);

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setReportError(null);
    setReportSubmitting(true);

    try {
      const res = await fetch("/api/teacher/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: reportFormData.type,
          facilityId: reportFormData.type === "FACILITY" ? reportFormData.facilityId : null,
          equipmentId: reportFormData.type === "EQUIPMENT" ? reportFormData.equipmentId : null,
          title: reportFormData.title,
          description: reportFormData.description,
          severity: reportFormData.severity,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setReportError(data.message || "Failed to submit damage report");
        return;
      }

      setShowCreateReportModal(false);
      setReportFormData({
        type: "FACILITY",
        facilityId: initialFacilities[0]?._id || "",
        equipmentId: initialEquipment[0]?._id || "",
        title: "",
        description: "",
        severity: "MEDIUM",
      });
      fetchReports();
    } catch {
      setReportError("Error communicating with server.");
    } finally {
      setReportSubmitting(false);
    }
  };

  return (
    <TeacherDashboardLayout
      title="Teacher & Faculty Portal"
      activeTab={activeTab}
      onTabChange={handleTabChange}
    >
      <div className="space-y-8">
        {/* ==================================================== */}
        {/* TAB 1: OVERVIEW */}
        {/* ==================================================== */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Faculty Welcome Hero */}
            <div className="relative overflow-hidden rounded-3xl border border-purple-900/50 bg-gradient-to-r from-[var(--surface)] via-[var(--surface)] to-[var(--app-bg)] p-6 sm:p-8 shadow-2xl">
              <div className="absolute right-0 top-0 -translate-y-12 translate-x-12 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="max-w-xl">
                  <div className="inline-flex items-center gap-2 rounded-full bg-purple-500/20 border border-purple-500/30 px-3 py-1 text-xs font-bold text-purple-300 mb-3">
                    <Sparkles className="h-3 w-3 text-purple-400" /> Faculty Sports Portal Active
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    Welcome, Professor {teacher.name}!
                  </h2>
                  <p className="mt-2 text-xs sm:text-sm text-purple-200/70 leading-relaxed">
                    Organize student athletic tournaments, schedule coaching sessions, track student participation attendance, and inspect facility availability.
                  </p>
                </div>

                <TeacherHero className="hidden lg:block w-64 xl:w-72 shrink-0 animate-float -my-4" />

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => {
                      handleTabChange("activities");
                      setShowCreateActivityModal(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-purple-500 hover:bg-purple-400 px-5 py-3 text-xs font-black text-white transition-all shadow-xl shadow-purple-500/20"
                  >
                    <Plus className="h-4 w-4" />
                    New Sports Activity
                  </button>
                  <button
                    onClick={() => handleTabChange("bookings")}
                    className="inline-flex items-center gap-2 rounded-xl border border-purple-800/80 bg-purple-950/40 px-4 py-3 text-xs font-bold text-purple-200 transition-all hover:bg-purple-900/50"
                  >
                    <Users className="h-4 w-4" />
                    Student Bookings
                  </button>
                </div>
              </div>
            </div>

            {/* Overview Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="rounded-2xl border border-purple-900/40 bg-purple-950/20 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                    Today&apos;s Sports Events
                  </span>
                  <Trophy className="h-5 w-5 text-purple-400" />
                </div>
                <div className="mt-4 text-3xl font-black text-white">
                  {statsLoading ? "..." : stats?.todayActivitiesCount ?? 0}
                </div>
                <p className="mt-1 text-xs text-purple-300/60">Organized campus athletic sessions</p>
              </div>

              <div className="rounded-2xl border border-purple-900/40 bg-purple-950/20 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                    My Created Activities
                  </span>
                  <Users className="h-5 w-5 text-indigo-400" />
                </div>
                <div className="mt-4 text-3xl font-black text-white">
                  {statsLoading ? "..." : stats?.myTotalActivitiesCount ?? 0}
                </div>
                <p className="mt-1 text-xs text-purple-300/60">Total tournaments & coaching events</p>
              </div>

              <div className="rounded-2xl border border-purple-900/40 bg-purple-950/20 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                    Active Facilities
                  </span>
                  <MapPin className="h-5 w-5 text-emerald-400" />
                </div>
                <div className="mt-4 text-3xl font-black text-white">
                  {statsLoading ? "..." : stats?.totalActiveFacilities ?? initialFacilities.length}
                </div>
                <p className="mt-1 text-xs text-purple-300/60">Courts & turf fields operational</p>
              </div>
            </div>

            {/* Upcoming Activities & Recent Student Bookings Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upcoming Activities */}
              <div className="rounded-2xl border border-purple-900/40 bg-[var(--surface)]/80 p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-purple-900/40 pb-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-purple-300 flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-purple-400" /> Upcoming Sports Activities
                  </h3>
                  <button
                    onClick={() => handleTabChange("activities")}
                    className="text-xs font-bold text-purple-400 hover:text-purple-300"
                  >
                    View All →
                  </button>
                </div>

                {stats?.upcomingActivities?.length > 0 ? (
                  <div className="space-y-3">
                    {stats.upcomingActivities.map((act: any) => (
                      <div
                        key={act._id}
                        className="p-3.5 rounded-xl border border-purple-900/30 bg-purple-950/30 flex items-center justify-between"
                      >
                        <div>
                          <h4 className="text-sm font-bold text-white">{act.title}</h4>
                          <p className="text-xs text-purple-300/70 mt-0.5">
                            {act.facility?.name} • {new Date(act.startAt).toLocaleDateString("en-US")}
                          </p>
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          {act.sportType}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-6 text-center">
                    No upcoming sports activities scheduled yet.
                  </p>
                )}
              </div>

              {/* Recent Student Bookings */}
              <div className="rounded-2xl border border-purple-900/40 bg-[var(--surface)]/80 p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-purple-900/40 pb-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-purple-300 flex items-center gap-2">
                    <Users className="h-4 w-4 text-indigo-400" /> Recent Student Bookings
                  </h3>
                  <button
                    onClick={() => handleTabChange("bookings")}
                    className="text-xs font-bold text-purple-400 hover:text-purple-300"
                  >
                    View All →
                  </button>
                </div>

                {stats?.recentStudentBookings?.length > 0 ? (
                  <div className="space-y-3">
                    {stats.recentStudentBookings.map((bk: any) => (
                      <div
                        key={bk._id}
                        className="p-3.5 rounded-xl border border-purple-900/30 bg-purple-950/30 flex items-center justify-between"
                      >
                        <div>
                          <h4 className="text-sm font-bold text-white">{bk.user?.name || "Student"}</h4>
                          <p className="text-xs text-purple-300/70 mt-0.5">
                            {bk.facility?.name} • {bk.startTime} - {bk.endTime}
                          </p>
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {bk.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-6 text-center">
                    No recent student reservations recorded.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 2: SPORTS ACTIVITIES */}
        {/* ==================================================== */}
        {activeTab === "activities" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-purple-400" /> Faculty Sports Activities
                </h2>
                <p className="text-xs text-purple-300/70 mt-0.5">
                  Organize team sessions, open tournaments, and coaching clinics.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowCreateActivityModal(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-purple-500 hover:bg-purple-400 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-purple-500/20 transition-all"
                >
                  <Plus className="h-4 w-4" />
                  Create Activity
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl border border-purple-900/40 bg-purple-950/20">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search activities by title..."
                  value={activitySearch}
                  onChange={(e) => setActivitySearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-purple-950/40 border border-purple-900/50 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <select
                value={activityFilterStatus}
                onChange={(e) => setActivityFilterStatus(e.target.value)}
                className="px-3 py-2 rounded-xl bg-purple-950/40 border border-purple-900/50 text-xs text-purple-200 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              <button
                type="button"
                onClick={() => setActivityFilterMine(!activityFilterMine)}
                className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                  activityFilterMine
                    ? "bg-purple-500/20 border-purple-500 text-purple-300"
                    : "bg-purple-950/40 border-purple-900/50 text-slate-400 hover:text-white"
                }`}
              >
                {activityFilterMine ? "✓ Only My Activities" : "Show All Activities"}
              </button>
            </div>

            {/* Activities List */}
            {activitiesLoading ? (
              <div className="py-12 flex justify-center items-center text-purple-400">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : activities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {activities.map((act) => {
                  const isOwner = act.createdBy?._id === teacher.id;
                  return (
                    <div
                      key={act._id}
                      className="rounded-2xl border border-purple-900/40 bg-[var(--surface)] p-5 flex flex-col justify-between space-y-4 shadow-lg hover:border-purple-500/40 transition-all"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400">
                            {act.sportType}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              act.status === "SCHEDULED"
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : act.status === "CANCELLED"
                                ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                : "bg-zinc-500/20 text-zinc-300 border border-zinc-500/30"
                            }`}
                          >
                            {act.status}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-white tracking-tight">{act.title}</h3>
                        {act.description && (
                          <p className="text-xs text-slate-400 line-clamp-2">{act.description}</p>
                        )}

                        <div className="space-y-1.5 pt-2 text-xs text-purple-300/80">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-purple-400" />
                            <span>{act.facility?.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CalendarDays className="h-3.5 w-3.5 text-purple-400" />
                            <span>
                              {new Date(act.startAt).toLocaleString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-3.5 w-3.5 text-purple-400" />
                            <span>
                              {act.participants?.length || 0} / {act.participantLimit} Participants
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-purple-900/40 flex items-center justify-between">
                        <span className="text-[11px] text-slate-500">
                          By {isOwner ? "You" : act.createdBy?.name || "Faculty"}
                        </span>

                        <div className="flex items-center gap-2">
                          {isOwner && act.status === "SCHEDULED" && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedAttendanceActivityId(act._id);
                                  handleTabChange("attendance");
                                  fetchActivityAttendance(act._id);
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-semibold"
                              >
                                Attendance
                              </button>
                              <button
                                onClick={() => handleCancelActivity(act._id)}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 rounded-2xl border border-purple-900/40 bg-purple-950/20 text-center space-y-3">
                <Trophy className="h-8 w-8 text-purple-400 mx-auto" />
                <h3 className="text-sm font-bold text-white">No sports activities found</h3>
                <p className="text-xs text-slate-400">
                  Create a new tournament, coaching clinic, or sports session to get started.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 3: STUDENT BOOKINGS (READ ONLY) */}
        {/* ==================================================== */}
        {activeTab === "bookings" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-400" /> Student Booking Activity
                </h2>
                <p className="text-xs text-purple-300/70 mt-0.5">
                  View student reservations across facilities. Modifying or cancelling student reservations is restricted to administrative staff.
                </p>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl border border-purple-900/40 bg-purple-950/20">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search by student name or email..."
                  value={bookingSearch}
                  onChange={(e) => setBookingSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-purple-950/40 border border-purple-900/50 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <select
                value={bookingFacilityFilter}
                onChange={(e) => setBookingFacilityFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-purple-950/40 border border-purple-900/50 text-xs text-purple-200 focus:outline-none"
              >
                <option value="">All Facilities</option>
                {initialFacilities.map((f) => (
                  <option key={f._id} value={f._id}>
                    {f.name}
                  </option>
                ))}
              </select>

              <select
                value={bookingStatusFilter}
                onChange={(e) => setBookingStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-purple-950/40 border border-purple-900/50 text-xs text-purple-200 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="PENDING">Pending</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            {/* Bookings Table */}
            <div className="rounded-2xl border border-purple-900/40 bg-[var(--surface)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-purple-950/60 border-b border-purple-900/50 text-purple-300 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Student</th>
                      <th className="p-4">Facility</th>
                      <th className="p-4">Sport</th>
                      <th className="p-4">Date & Time</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-900/30 text-slate-300">
                    {bookingsLoading ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-purple-400">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        </td>
                      </tr>
                    ) : studentBookings.length > 0 ? (
                      studentBookings.map((b) => (
                        <tr key={b._id} className="hover:bg-purple-950/30 transition-colors">
                          <td className="p-4">
                            <div className="font-bold text-white">{b.user?.name || "Student"}</div>
                            <div className="text-[11px] text-slate-500">{b.user?.email}</div>
                          </td>
                          <td className="p-4 font-semibold text-purple-200">{b.facility?.name}</td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-bold">
                              {b.facility?.sportType || "SPORTS"}
                            </span>
                          </td>
                          <td className="p-4">
                            <div>{new Date(b.bookingDate).toLocaleDateString("en-US")}</div>
                            <div className="text-[11px] text-slate-500">
                              {b.startTime} - {b.endTime}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="text-[11px] font-semibold text-slate-400">
                              {b.bookingType || "REGULAR"}
                            </span>
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                                b.status === "CONFIRMED"
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  : b.status === "COMPLETED"
                                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                  : b.status === "CANCELLED"
                                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                  : "bg-zinc-500/20 text-zinc-300 border border-zinc-500/30"
                              }`}
                            >
                              {b.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => setSelectedBookingDetails(b)}
                              className="px-2.5 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-semibold inline-flex items-center gap-1.5"
                            >
                              <Eye className="h-3.5 w-3.5" /> View
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500">
                          No student bookings found matching your search criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 4: ATTENDANCE */}
        {/* ==================================================== */}
        {activeTab === "attendance" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-purple-400" /> Participant Attendance
              </h2>
              <p className="text-xs text-purple-300/70 mt-0.5">
                Mark present/absent for students registered in activities organized by you.
              </p>
            </div>

            {/* Activity Picker */}
            <div className="p-4 rounded-2xl border border-purple-900/40 bg-purple-950/20 flex flex-wrap items-center gap-4">
              <label className="text-xs font-bold text-purple-300 uppercase">
                Select Your Activity:
              </label>
              <select
                value={selectedAttendanceActivityId}
                onChange={(e) => {
                  setSelectedAttendanceActivityId(e.target.value);
                  fetchActivityAttendance(e.target.value);
                }}
                className="flex-1 min-w-[260px] px-3.5 py-2 rounded-xl bg-purple-950/50 border border-purple-900/60 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                <option value="">-- Choose an activity to track --</option>
                {activities
                  .filter((a) => a.createdBy?._id === teacher.id)
                  .map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.title} ({new Date(a.startAt).toLocaleDateString("en-US")}) -{" "}
                      {a.participants?.length || 0} participants
                    </option>
                  ))}
              </select>

              {selectedAttendanceActivityId && (
                <button
                  onClick={() => fetchActivityAttendance(selectedAttendanceActivityId)}
                  className="p-2 rounded-xl bg-purple-900/40 hover:bg-purple-900/70 text-purple-300 transition-colors"
                  title="Reload"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              )}
            </div>

            {attendanceSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{attendanceSuccess}</span>
              </div>
            )}

            {/* Attendance Participant List */}
            {selectedAttendanceActivityId ? (
              <div className="rounded-2xl border border-purple-900/40 bg-[var(--surface)] p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-purple-900/40">
                  <h3 className="text-sm font-bold text-white">Registered Students</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setAttendanceParticipants((prev) =>
                          prev.map((p) => ({ ...p, attendanceStatus: "PRESENT" }))
                        )
                      }
                      className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30"
                    >
                      All Present
                    </button>
                    <button
                      onClick={() =>
                        setAttendanceParticipants((prev) =>
                          prev.map((p) => ({ ...p, attendanceStatus: "ABSENT" }))
                        )
                      }
                      className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30"
                    >
                      All Absent
                    </button>
                  </div>
                </div>

                {attendanceLoading ? (
                  <div className="py-12 flex justify-center items-center text-purple-400">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : attendanceParticipants.length > 0 ? (
                  <div className="space-y-3">
                    {attendanceParticipants.map((p) => (
                      <div
                        key={p._id}
                        className="p-3.5 rounded-xl border border-purple-900/30 bg-purple-950/30 flex items-center justify-between"
                      >
                        <div>
                          <h4 className="text-sm font-bold text-white">{p.user?.name || "Student"}</h4>
                          <p className="text-xs text-slate-400">{p.user?.email}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateParticipantStatus(p._id, "PRESENT")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              p.attendanceStatus === "PRESENT"
                                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                                : "bg-purple-950/60 text-slate-400 hover:text-emerald-300"
                            }`}
                          >
                            ✓ Present
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateParticipantStatus(p._id, "ABSENT")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              p.attendanceStatus === "ABSENT"
                                ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                                : "bg-purple-950/60 text-slate-400 hover:text-rose-300"
                            }`}
                          >
                            ✕ Absent
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateParticipantStatus(p._id, "REGISTERED")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              p.attendanceStatus === "REGISTERED"
                                ? "bg-purple-600 text-white"
                                : "bg-purple-950/60 text-slate-400 hover:text-purple-300"
                            }`}
                          >
                            Registered
                          </button>
                        </div>
                      </div>
                    ))}

                    <div className="pt-4 border-t border-purple-900/40 flex justify-end">
                      <button
                        onClick={handleSaveAttendance}
                        disabled={attendanceSaving}
                        className="px-6 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white text-xs font-bold shadow-lg shadow-purple-500/20 disabled:opacity-50"
                      >
                        {attendanceSaving ? "Saving..." : "Save Attendance Records"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-6 text-center">
                    No participants have registered for this activity yet.
                  </p>
                )}
              </div>
            ) : (
              <div className="p-8 rounded-2xl border border-purple-900/40 bg-purple-950/20 text-center text-slate-400 text-xs">
                Please select one of your organized activities from the dropdown above to view and track attendance.
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 5: FACILITY SCHEDULE (PRIVACY SAFE) */}
        {/* ==================================================== */}
        {activeTab === "schedule" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-400" /> Facility Operating Schedule
              </h2>
              <p className="text-xs text-purple-300/70 mt-0.5">
                Inspect court operating hours, scheduled maintenance, and reserved time slots. Student personal details are protected.
              </p>
            </div>

            {/* Filter Bar */}
            <div className="p-4 rounded-2xl border border-purple-900/40 bg-purple-950/20 flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-[11px] font-bold text-purple-300 uppercase mb-1">
                  Facility:
                </label>
                <select
                  value={scheduleFacilityId}
                  onChange={(e) => setScheduleFacilityId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-purple-950/50 border border-purple-900/60 text-xs text-white focus:outline-none"
                >
                  {initialFacilities.map((f) => (
                    <option key={f._id} value={f._id}>
                      {f.name} ({f.sportType})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-purple-300 uppercase mb-1">
                  Date:
                </label>
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="px-3.5 py-2 rounded-xl bg-purple-950/50 border border-purple-900/60 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="self-end">
                <button
                  onClick={fetchFacilitySchedule}
                  className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-white text-xs font-bold"
                >
                  Load Schedule
                </button>
              </div>
            </div>

            {/* Schedule View */}
            {scheduleLoading ? (
              <div className="py-12 flex justify-center items-center text-purple-400">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : scheduleData ? (
              <div className="space-y-6">
                {/* Facility Info Card */}
                <div className="p-5 rounded-2xl border border-purple-900/40 bg-[var(--surface)] flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-white">{scheduleData.facility?.name}</h3>
                    <p className="text-xs text-purple-300/70">
                      {scheduleData.facility?.location} • Sport: {scheduleData.facility?.sportType}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="px-3 py-1 rounded-xl bg-purple-950 border border-purple-800 text-purple-300 font-semibold">
                      Hours: {scheduleData.facility?.operatingHours?.open} -{" "}
                      {scheduleData.facility?.operatingHours?.close}
                    </span>
                    <span className="px-3 py-1 rounded-xl bg-purple-950 border border-purple-800 text-purple-300 font-semibold">
                      Slot: {scheduleData.facility?.slotDuration || 60} mins
                    </span>
                  </div>
                </div>

                {/* Timeline Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Confirmed Bookings */}
                  <div className="rounded-2xl border border-purple-900/40 bg-[var(--surface)] p-5 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center justify-between">
                      <span>Reserved Time Slots ({scheduleData.bookings?.length || 0})</span>
                      <span className="text-[10px] text-slate-500 font-normal">Privacy Protected</span>
                    </h4>

                    {scheduleData.bookings?.length > 0 ? (
                      <div className="space-y-2">
                        {scheduleData.bookings.map((b: any) => (
                          <div
                            key={b._id}
                            className="p-3 rounded-xl border border-purple-900/30 bg-purple-950/20 flex items-center justify-between text-xs"
                          >
                            <div className="font-semibold text-white">
                              {b.startTime} - {b.endTime}
                            </div>
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                              {b.bookingType || "RESERVED"}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 py-4 text-center">No bookings on this day.</p>
                    )}
                  </div>

                  {/* Scheduled Maintenance */}
                  <div className="rounded-2xl border border-purple-900/40 bg-[var(--surface)] p-5 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                      Maintenance Windows ({scheduleData.maintenance?.length || 0})
                    </h4>

                    {scheduleData.maintenance?.length > 0 ? (
                      <div className="space-y-2">
                        {scheduleData.maintenance.map((m: any) => (
                          <div
                            key={m._id}
                            className="p-3 rounded-xl border border-amber-900/30 bg-amber-950/20 text-xs space-y-1"
                          >
                            <div className="font-bold text-amber-300">{m.reason}</div>
                            <div className="text-[11px] text-slate-400">
                              {new Date(m.startAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} -{" "}
                              {new Date(m.endAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 py-4 text-center">No maintenance scheduled.</p>
                    )}
                  </div>

                  {/* Sports Activities */}
                  <div className="rounded-2xl border border-purple-900/40 bg-[var(--surface)] p-5 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300">
                      Sports Activities ({scheduleData.activities?.length || 0})
                    </h4>

                    {scheduleData.activities?.length > 0 ? (
                      <div className="space-y-2">
                        {scheduleData.activities.map((a: any) => (
                          <div
                            key={a._id}
                            className="p-3 rounded-xl border border-purple-900/30 bg-purple-950/20 text-xs space-y-1"
                          >
                            <div className="font-bold text-white">{a.title}</div>
                            <div className="text-[11px] text-purple-300/70">
                              By {a.organizer} • {a.participantCount}/{a.participantLimit} Attending
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 py-4 text-center">No activities on this date.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 6: MAINTENANCE & DAMAGE REPORTS */}
        {/* ==================================================== */}
        {activeTab === "maintenance" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-400" /> Damage & Maintenance Reports
                </h2>
                <p className="text-xs text-purple-300/70 mt-0.5">
                  Report facility or equipment damage directly to sports administrators.
                </p>
              </div>

              <button
                onClick={() => setShowCreateReportModal(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition-all"
              >
                <Plus className="h-4 w-4" />
                Report Damage
              </button>
            </div>

            {/* Reports List */}
            {reportsLoading ? (
              <div className="py-12 flex justify-center items-center text-purple-400">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : teacherReports.length > 0 ? (
              <div className="space-y-3">
                {teacherReports.map((r) => (
                  <div
                    key={r._id}
                    className="p-5 rounded-2xl border border-purple-900/40 bg-[var(--surface)] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 max-w-xl">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 uppercase">
                          {r.type}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            r.severity === "CRITICAL" || r.severity === "HIGH"
                              ? "bg-rose-500/20 text-rose-400"
                              : "bg-amber-500/20 text-amber-400"
                          }`}
                        >
                          {r.severity} Severity
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white">{r.title}</h4>
                      <p className="text-xs text-slate-400">{r.description}</p>
                      <p className="text-[11px] text-purple-300/60 pt-1">
                        Reported on {new Date(r.createdAt).toLocaleDateString("en-US")}
                        {r.facility?.name ? ` • Facility: ${r.facility.name}` : ""}
                        {r.equipment?.name ? ` • Equipment: ${r.equipment.name}` : ""}
                      </p>
                    </div>

                    <div>
                      <span
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${
                          r.status === "RESOLVED"
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                            : r.status === "ACKNOWLEDGED"
                            ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                            : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                        }`}
                      >
                        Status: {r.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-2xl border border-purple-900/40 bg-purple-950/20 text-center space-y-3">
                <AlertTriangle className="h-8 w-8 text-amber-400 mx-auto" />
                <h3 className="text-sm font-bold text-white">No damage reports submitted</h3>
                <p className="text-xs text-slate-400">
                  Submit a report if you notice broken equipment or facility wear that requires repair.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ==================================================== */}
      {/* MODAL 1: CREATE SPORTS ACTIVITY */}
      {/* ==================================================== */}
      {showCreateActivityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-purple-900/60 bg-[var(--surface)] p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-purple-900/40 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Trophy className="h-5 w-5 text-purple-400" /> Create Sports Activity
              </h3>
              <button
                onClick={() => setShowCreateActivityModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {activityFormError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {activityFormError}
              </div>
            )}

            <form onSubmit={handleCreateActivity} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-purple-300 uppercase mb-1">
                  Activity Title:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Faculty-Student Badminton Tournament"
                  value={activityFormData.title}
                  onChange={(e) =>
                    setActivityFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-purple-950/50 border border-purple-900/60 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block font-bold text-purple-300 uppercase mb-1">
                  Description:
                </label>
                <textarea
                  rows={2}
                  placeholder="Rules, match format, equipment requirements..."
                  value={activityFormData.description}
                  onChange={(e) =>
                    setActivityFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-purple-950/50 border border-purple-900/60 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-purple-300 uppercase mb-1">
                    Sport Type:
                  </label>
                  <select
                    value={activityFormData.sportType}
                    onChange={(e) =>
                      setActivityFormData((prev) => ({ ...prev, sportType: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-purple-950/50 border border-purple-900/60 text-white focus:outline-none"
                  >
                    <option value="BADMINTON">Badminton</option>
                    <option value="BASKETBALL">Basketball</option>
                    <option value="FOOTBALL">Football</option>
                    <option value="CRICKET">Cricket</option>
                    <option value="TENNIS">Tennis</option>
                    <option value="GYM">Gym</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-purple-300 uppercase mb-1">
                    Facility:
                  </label>
                  <select
                    value={activityFormData.facilityId}
                    onChange={(e) =>
                      setActivityFormData((prev) => ({ ...prev, facilityId: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-purple-950/50 border border-purple-900/60 text-white focus:outline-none"
                  >
                    {initialFacilities.map((f) => (
                      <option key={f._id} value={f._id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-purple-300 uppercase mb-1">
                    Date:
                  </label>
                  <input
                    type="date"
                    required
                    value={activityFormData.startDate}
                    onChange={(e) =>
                      setActivityFormData((prev) => ({ ...prev, startDate: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-purple-950/50 border border-purple-900/60 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-purple-300 uppercase mb-1">
                    Start Time:
                  </label>
                  <input
                    type="time"
                    required
                    value={activityFormData.startTime}
                    onChange={(e) =>
                      setActivityFormData((prev) => ({ ...prev, startTime: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-purple-950/50 border border-purple-900/60 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-purple-300 uppercase mb-1">
                    End Time:
                  </label>
                  <input
                    type="time"
                    required
                    value={activityFormData.endTime}
                    onChange={(e) =>
                      setActivityFormData((prev) => ({ ...prev, endTime: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-purple-950/50 border border-purple-900/60 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-purple-300 uppercase mb-1">
                  Participant Limit:
                </label>
                <input
                  type="number"
                  min={2}
                  max={200}
                  required
                  value={activityFormData.participantLimit}
                  onChange={(e) =>
                    setActivityFormData((prev) => ({
                      ...prev,
                      participantLimit: Number(e.target.value),
                    }))
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-purple-950/50 border border-purple-900/60 text-white focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateActivityModal(false)}
                  className="px-4 py-2 rounded-xl border border-purple-900/60 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={activitySubmitting}
                  className="px-5 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold disabled:opacity-50"
                >
                  {activitySubmitting ? "Checking Availability..." : "Schedule Activity"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 2: DAMAGE REPORT SUBMISSION */}
      {/* ==================================================== */}
      {showCreateReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-purple-900/60 bg-[var(--surface)] p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-purple-900/40 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-400" /> Report Facility / Equipment Damage
              </h3>
              <button
                onClick={() => setShowCreateReportModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {reportError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {reportError}
              </div>
            )}

            <form onSubmit={handleCreateReport} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-purple-300 uppercase mb-1">
                    Report Type:
                  </label>
                  <select
                    value={reportFormData.type}
                    onChange={(e) =>
                      setReportFormData((prev) => ({
                        ...prev,
                        type: e.target.value as "FACILITY" | "EQUIPMENT",
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-purple-950/50 border border-purple-900/60 text-white focus:outline-none"
                  >
                    <option value="FACILITY">Facility Damage</option>
                    <option value="EQUIPMENT">Equipment Damage</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-purple-300 uppercase mb-1">
                    Severity:
                  </label>
                  <select
                    value={reportFormData.severity}
                    onChange={(e) =>
                      setReportFormData((prev) => ({
                        ...prev,
                        severity: e.target.value as any,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-purple-950/50 border border-purple-900/60 text-white focus:outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              {reportFormData.type === "FACILITY" ? (
                <div>
                  <label className="block font-bold text-purple-300 uppercase mb-1">
                    Target Facility:
                  </label>
                  <select
                    value={reportFormData.facilityId}
                    onChange={(e) =>
                      setReportFormData((prev) => ({ ...prev, facilityId: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-purple-950/50 border border-purple-900/60 text-white focus:outline-none"
                  >
                    {initialFacilities.map((f) => (
                      <option key={f._id} value={f._id}>
                        {f.name} ({f.location})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block font-bold text-purple-300 uppercase mb-1">
                    Target Equipment Item:
                  </label>
                  <select
                    value={reportFormData.equipmentId}
                    onChange={(e) =>
                      setReportFormData((prev) => ({ ...prev, equipmentId: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-purple-950/50 border border-purple-900/60 text-white focus:outline-none"
                  >
                    {initialEquipment.map((eq) => (
                      <option key={eq._id} value={eq._id}>
                        {eq.name} ({eq.category})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-bold text-purple-300 uppercase mb-1">
                  Issue Summary:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Torn badminton net on Court 2"
                  value={reportFormData.title}
                  onChange={(e) =>
                    setReportFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-purple-950/50 border border-purple-900/60 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block font-bold text-purple-300 uppercase mb-1">
                  Detailed Description:
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe the damage, hazard level, and exact location..."
                  value={reportFormData.description}
                  onChange={(e) =>
                    setReportFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-purple-950/50 border border-purple-900/60 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateReportModal(false)}
                  className="px-4 py-2 rounded-xl border border-purple-900/60 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reportSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold disabled:opacity-50"
                >
                  {reportSubmitting ? "Submitting..." : "Submit Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 3: VIEW BOOKING DETAILS (READ ONLY) */}
      {/* ==================================================== */}
      {selectedBookingDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-purple-900/60 bg-[var(--surface)] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-purple-900/40 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-400" /> Booking Details
              </h3>
              <button
                onClick={() => setSelectedBookingDetails(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-900/40">
                <p className="text-[10px] uppercase font-bold text-purple-400">Student</p>
                <p className="text-sm font-bold text-white">{selectedBookingDetails.user?.name}</p>
                <p className="text-slate-400">{selectedBookingDetails.user?.email}</p>
              </div>

              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-900/40 space-y-1">
                <p className="text-[10px] uppercase font-bold text-purple-400">Facility</p>
                <p className="text-sm font-bold text-white">{selectedBookingDetails.facility?.name}</p>
                <p className="text-slate-400">Sport: {selectedBookingDetails.facility?.sportType}</p>
                <p className="text-slate-400">Location: {selectedBookingDetails.facility?.location}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-900/40">
                  <p className="text-[10px] uppercase font-bold text-purple-400">Time Window</p>
                  <p className="font-bold text-white">
                    {selectedBookingDetails.startTime} - {selectedBookingDetails.endTime}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-900/40">
                  <p className="text-[10px] uppercase font-bold text-purple-400">Status</p>
                  <p className="font-bold text-emerald-400">{selectedBookingDetails.status}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-900/30 text-[11px] text-slate-400 flex items-start gap-2">
                <Info className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                <span>
                  Faculty can view student bookings for coordination. Modifying or cancelling student reservations requires administrative privileges.
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedBookingDetails(null)}
                className="px-4 py-2 rounded-xl bg-purple-900/40 hover:bg-purple-900/60 text-purple-200 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </TeacherDashboardLayout>
  );
}

