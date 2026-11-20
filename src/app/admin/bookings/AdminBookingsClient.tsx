"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Search,
  Filter,
  RefreshCw,
  Zap,
  Check,
  X,
  AlertCircle,
  Clock,
  UserCheck,
  Ban,
  CheckCircle2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { AdminBookingStats } from "@/services/booking.service";

export interface BookingUser {
  _id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  role?: string;
}

export interface BookingFacility {
  _id: string;
  name: string;
  sportType: string;
  location: string;
  operatingHours?: { open: string; close: string };
  slotDuration?: number;
}

export interface AdminBookingItem {
  _id: string;
  user: BookingUser;
  facility: BookingFacility;
  bookingDate: string;
  startTime: string;
  endTime: string;
  startAt: string;
  endAt: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "REJECTED";
  bookingType: "REGULAR" | "PRIME_TIME";
  attendanceStatus: "PENDING" | "CHECKED_IN" | "NO_SHOW";
  cancellationReason?: string;
  cancelledAt?: string;
  markedNoShowAt?: string;
  markedNoShowBy?: { name: string; email: string };
  markedCheckInAt?: string;
  markedCheckInBy?: { name: string; email: string };
  createdAt: string;
  updatedAt: string;
}

interface FacilityOption {
  _id: string;
  name: string;
  sportType: string;
  location: string;
}

interface AdminBookingsClientProps {
  initialBookings: AdminBookingItem[];
  initialPagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  initialStats: AdminBookingStats;
  facilities: FacilityOption[];
}

const SPORT_OPTIONS = [
  "ALL",
  "BADMINTON",
  "BASKETBALL",
  "FOOTBALL",
  "CRICKET",
  "TENNIS",
  "GYM",
  "OTHER",
];

const STATUS_OPTIONS = [
  "ALL",
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
  "REJECTED",
];

export default function AdminBookingsClient({
  initialBookings,
  initialPagination,
  initialStats,
  facilities,
}: AdminBookingsClientProps) {
  // Data state
  const [bookings, setBookings] = useState<AdminBookingItem[]>(initialBookings);
  const [pagination, setPagination] = useState(initialPagination);
  const [stats, setStats] = useState<AdminBookingStats>(initialStats);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Filters state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [facilityFilter, setFacilityFilter] = useState("ALL");
  const [sportFilter, setSportFilter] = useState("ALL");
  const [bookingTypeFilter, setBookingTypeFilter] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortField, setSortField] = useState("startAt:desc");
  const [page, setPage] = useState(1);

  // Action modal states
  const [cancelModalBooking, setCancelModalBooking] = useState<AdminBookingItem | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [rejectModalBooking, setRejectModalBooking] = useState<AdminBookingItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Explicit fetch handler
  const fetchBookings = useCallback(
    async (overrides?: {
      page?: number;
      search?: string;
      status?: string;
      facilityId?: string;
      sportType?: string;
      bookingType?: string;
      startDate?: string;
      endDate?: string;
      sort?: string;
    }) => {
      setLoading(true);
      setError(null);

      const qPage = overrides?.page !== undefined ? overrides.page : page;
      const qSearch = overrides?.search !== undefined ? overrides.search : search;
      const qStatus = overrides?.status !== undefined ? overrides.status : statusFilter;
      const qFacility = overrides?.facilityId !== undefined ? overrides.facilityId : facilityFilter;
      const qSport = overrides?.sportType !== undefined ? overrides.sportType : sportFilter;
      const qType = overrides?.bookingType !== undefined ? overrides.bookingType : bookingTypeFilter;
      const qStart = overrides?.startDate !== undefined ? overrides.startDate : startDate;
      const qEnd = overrides?.endDate !== undefined ? overrides.endDate : endDate;
      const qSort = overrides?.sort !== undefined ? overrides.sort : sortField;

      try {
        const params = new URLSearchParams();
        params.set("page", qPage.toString());
        params.set("limit", "10");
        params.set("sort", qSort);

        if (qSearch.trim()) params.set("search", qSearch.trim());
        if (qStatus !== "ALL") params.set("status", qStatus);
        if (qFacility !== "ALL") params.set("facilityId", qFacility);
        if (qSport !== "ALL") params.set("sportType", qSport);
        if (qType !== "ALL") params.set("bookingType", qType);
        if (qStart) params.set("startDate", qStart);
        if (qEnd) params.set("endDate", qEnd);

        const res = await fetch(`/api/admin/bookings?${params.toString()}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to load bookings");
        }

        setBookings(data.bookings || []);
        setPagination(data.pagination);
        if (data.stats) {
          setStats(data.stats);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error fetching bookings");
      } finally {
        setLoading(false);
      }
    },
    [
      page,
      search,
      statusFilter,
      facilityFilter,
      sportFilter,
      bookingTypeFilter,
      startDate,
      endDate,
      sortField,
    ]
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchBookings({ search, page: 1 });
  };

  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setFacilityFilter("ALL");
    setSportFilter("ALL");
    setBookingTypeFilter("ALL");
    setStartDate("");
    setEndDate("");
    setSortField("startAt:desc");
    setPage(1);
    fetchBookings({
      search: "",
      status: "ALL",
      facilityId: "ALL",
      sportType: "ALL",
      bookingType: "ALL",
      startDate: "",
      endDate: "",
      sort: "startAt:desc",
      page: 1,
    });
  };

  // Handle status updates (Approve, Reject, Cancel, Complete)
  const handleUpdateStatus = async (
    bookingId: string,
    targetStatus: "CONFIRMED" | "CANCELLED" | "REJECTED" | "COMPLETED",
    reason?: string
  ) => {
    setIsSubmittingAction(true);
    setError(null);
    setActionSuccess(null);

    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus, reason }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update booking status");
      }

      setActionSuccess(data.message || `Booking status updated to ${targetStatus}`);
      setCancelModalBooking(null);
      setCancelReason("");
      setRejectModalBooking(null);
      setRejectReason("");

      // Refresh data
      await fetchBookings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Handle attendance check-in / no-show
  const handleUpdateAttendance = async (
    bookingId: string,
    attendanceStatus: "CHECKED_IN" | "NO_SHOW"
  ) => {
    setIsSubmittingAction(true);
    setError(null);
    setActionSuccess(null);

    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/attendance`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendanceStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update attendance");
      }

      setActionSuccess(`Attendance recorded as ${attendanceStatus}`);
      await fetchBookings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record attendance");
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case "PENDING":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "CANCELLED":
        return "bg-rose-500/10 text-rose-400 border-rose-500/30";
      case "COMPLETED":
        return "bg-sky-500/10 text-sky-400 border-sky-500/30";
      case "REJECTED":
        return "bg-zinc-800 text-zinc-400 border-zinc-700";
      default:
        return "bg-zinc-800 text-zinc-300 border-zinc-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <CalendarDays className="w-7 h-7 text-emerald-400" />
            Booking Management
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Monitor, approve, cancel, and manage sports facility reservations across the campus
          </p>
        </div>
        <button
          onClick={() => fetchBookings()}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-400" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess(null)}
            className="text-emerald-400/70 hover:text-emerald-400 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-rose-400/70 hover:text-rose-400 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Database Statistics Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total Bookings</p>
          <p className="text-2xl font-extrabold text-white mt-1.5">{stats.total.toLocaleString("en-US")}</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">All recorded bookings</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4">
          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Confirmed</p>
          <p className="text-2xl font-extrabold text-emerald-400 mt-1.5">{stats.confirmed.toLocaleString("en-US")}</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">Active facility reservations</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4">
          <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Pending</p>
          <p className="text-2xl font-extrabold text-amber-400 mt-1.5">{stats.pending.toLocaleString("en-US")}</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">Awaiting admin review</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4">
          <p className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Cancelled</p>
          <p className="text-2xl font-extrabold text-rose-400 mt-1.5">{stats.cancelled.toLocaleString("en-US")}</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">User or admin cancelled</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 col-span-2 sm:col-span-1">
          <p className="text-xs font-semibold text-sky-400 uppercase tracking-wider">Completed</p>
          <p className="text-2xl font-extrabold text-sky-400 mt-1.5">{stats.completed.toLocaleString("en-US")}</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">Past concluded sessions</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 space-y-4">
        {/* Search row */}
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by student name, email, facility name, or booking ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-emerald-500 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-bold text-zinc-950 bg-emerald-500 hover:bg-emerald-400 rounded-xl transition-colors shrink-0 shadow-sm shadow-emerald-500/20"
          >
            Search
          </button>
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-3.5 py-2 text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-xl transition-colors shrink-0"
          >
            Reset Filters
          </button>
        </form>

        {/* Filter controls row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Status */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                const val = e.target.value;
                setStatusFilter(val);
                setPage(1);
                fetchBookings({ status: val, page: 1 });
              }}
              className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
            >
              {STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>
                  {st === "ALL" ? "All Statuses" : st}
                </option>
              ))}
            </select>
          </div>

          {/* Facility */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
              Facility
            </label>
            <select
              value={facilityFilter}
              onChange={(e) => {
                const val = e.target.value;
                setFacilityFilter(val);
                setPage(1);
                fetchBookings({ facilityId: val, page: 1 });
              }}
              className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 truncate"
            >
              <option value="ALL">All Facilities</option>
              {facilities.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sport */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
              Sport Type
            </label>
            <select
              value={sportFilter}
              onChange={(e) => {
                const val = e.target.value;
                setSportFilter(val);
                setPage(1);
                fetchBookings({ sportType: val, page: 1 });
              }}
              className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
            >
              {SPORT_OPTIONS.map((sp) => (
                <option key={sp} value={sp}>
                  {sp === "ALL" ? "All Sports" : sp}
                </option>
              ))}
            </select>
          </div>

          {/* Booking Type */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
              Booking Type
            </label>
            <select
              value={bookingTypeFilter}
              onChange={(e) => {
                const val = e.target.value;
                setBookingTypeFilter(val);
                setPage(1);
                fetchBookings({ bookingType: val, page: 1 });
              }}
              className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Types</option>
              <option value="REGULAR">Regular</option>
              <option value="PRIME_TIME">Prime Time</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
              From Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                const val = e.target.value;
                setStartDate(val);
                setPage(1);
                fetchBookings({ startDate: val, page: 1 });
              }}
              className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Sort */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
              Sort By
            </label>
            <select
              value={sortField}
              onChange={(e) => {
                const val = e.target.value;
                setSortField(val);
                setPage(1);
                fetchBookings({ sort: val, page: 1 });
              }}
              className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="startAt:desc">Slot: Newest First</option>
              <option value="startAt:asc">Slot: Oldest First</option>
              <option value="createdAt:desc">Created: Newest First</option>
              <option value="createdAt:asc">Created: Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950/60 border-b border-zinc-800 text-zinc-400 uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4">Booking ID</th>
                <th className="py-3.5 px-4">Student / User</th>
                <th className="py-3.5 px-4">Facility & Sport</th>
                <th className="py-3.5 px-4">Date & Slot</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Attendance</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {loading ? (
                // Loading Skeleton Rows
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-4">
                      <div className="h-3.5 w-16 bg-zinc-800 rounded"></div>
                    </td>
                    <td className="py-4 px-4 space-y-1.5">
                      <div className="h-3.5 w-24 bg-zinc-800 rounded"></div>
                      <div className="h-3 w-32 bg-zinc-800/60 rounded"></div>
                    </td>
                    <td className="py-4 px-4 space-y-1.5">
                      <div className="h-3.5 w-28 bg-zinc-800 rounded"></div>
                      <div className="h-3 w-16 bg-zinc-800/60 rounded"></div>
                    </td>
                    <td className="py-4 px-4 space-y-1.5">
                      <div className="h-3.5 w-20 bg-zinc-800 rounded"></div>
                      <div className="h-3 w-24 bg-zinc-800/60 rounded"></div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 w-14 bg-zinc-800 rounded"></div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 w-16 bg-zinc-800 rounded"></div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 w-16 bg-zinc-800 rounded"></div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-6 w-20 bg-zinc-800 rounded ml-auto"></div>
                    </td>
                  </tr>
                ))
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Filter className="w-8 h-8 text-zinc-600" />
                      <p className="font-semibold text-sm text-zinc-300">No bookings found</p>
                      <p className="text-xs text-zinc-500">
                        Try adjusting your search query, status filter, or date range
                      </p>
                      <button
                        onClick={handleResetFilters}
                        className="mt-2 text-xs text-emerald-400 hover:text-emerald-300 underline underline-offset-4"
                      >
                        Reset all filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => {
                  const bDate = new Date(booking.startAt);
                  const formattedDate = bDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });

                  return (
                    <tr
                      key={booking._id}
                      className="hover:bg-zinc-800/30 transition-colors group"
                    >
                      {/* Booking ID */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-400">
                        <Link
                          href={`/admin/bookings/${booking._id}`}
                          className="hover:text-emerald-400 transition-colors flex items-center gap-1 group-hover:underline"
                        >
                          #{booking._id.slice(-6).toUpperCase()}
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      </td>

                      {/* Student / User */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-zinc-200">
                          {booking.user?.name || "Unknown User"}
                        </div>
                        <div className="text-[11px] text-zinc-400 flex items-center gap-1">
                          {booking.user?.email || "No email"}
                          {booking.user?.role === "TEACHER" && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                              Faculty
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Facility & Sport */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-zinc-200">
                          {booking.facility?.name || "Facility"}
                        </div>
                        <div className="text-[10px] text-zinc-400 font-mono">
                          {booking.facility?.sportType || "SPORT"} • {booking.facility?.location || "Campus"}
                        </div>
                      </td>

                      {/* Date & Time Slot */}
                      <td className="py-3.5 px-4">
                        <div className="text-zinc-200 font-medium">{formattedDate}</div>
                        <div className="text-[11px] text-zinc-400 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3 text-zinc-500" />
                          {booking.startTime} - {booking.endTime}
                        </div>
                      </td>

                      {/* Booking Type */}
                      <td className="py-3.5 px-4">
                        {booking.bookingType === "PRIME_TIME" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <Zap className="w-2.5 h-2.5 fill-amber-400" />
                            Prime
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
                            Regular
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadge(
                            booking.status
                          )}`}
                        >
                          {booking.status}
                        </span>
                        {booking.cancellationReason && (
                          <div
                            title={booking.cancellationReason}
                            className="text-[10px] text-rose-400/80 truncate max-w-[120px] mt-0.5 italic"
                          >
                            &quot;{booking.cancellationReason}&quot;
                          </div>
                        )}
                      </td>

                      {/* Attendance */}
                      <td className="py-3.5 px-4">
                        {booking.attendanceStatus === "CHECKED_IN" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                            <Check className="w-3 h-3" /> Checked In
                          </span>
                        ) : booking.attendanceStatus === "NO_SHOW" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400">
                            <Ban className="w-3 h-3" /> No Show
                          </span>
                        ) : (
                          <span className="text-[11px] text-zinc-500 font-mono">Pending</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Details Link */}
                          <Link
                            href={`/admin/bookings/${booking._id}`}
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                            title="View Booking Details"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>

                          {/* PENDING: Approve / Reject */}
                          {booking.status === "PENDING" && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(booking._id, "CONFIRMED")}
                                disabled={isSubmittingAction}
                                className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors"
                                title="Approve & Confirm Reservation"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setRejectModalBooking(booking)}
                                disabled={isSubmittingAction}
                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
                                title="Reject Reservation"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {/* CONFIRMED: Complete or Cancel */}
                          {booking.status === "CONFIRMED" && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(booking._id, "COMPLETED")}
                                disabled={isSubmittingAction}
                                className="p-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 transition-colors"
                                title="Mark as Completed"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setCancelModalBooking(booking)}
                                disabled={isSubmittingAction}
                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
                                title="Cancel Booking"
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </button>
                              {/* Attendance action toggles */}
                              {booking.attendanceStatus !== "CHECKED_IN" && (
                                <button
                                  onClick={() => handleUpdateAttendance(booking._id, "CHECKED_IN")}
                                  disabled={isSubmittingAction}
                                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-emerald-400 transition-colors"
                                  title="Check In Student"
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="bg-zinc-950/60 border-t border-zinc-800 px-4 py-3 flex items-center justify-between text-xs text-zinc-400">
          <div>
            Showing{" "}
            <span className="font-semibold text-zinc-200">
              {bookings.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-zinc-200">
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>{" "}
            of <span className="font-semibold text-zinc-200">{pagination.total}</span> bookings
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                const newPage = Math.max(page - 1, 1);
                setPage(newPage);
                fetchBookings({ page: newPage });
              }}
              disabled={pagination.page <= 1 || loading}
              className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-300 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono text-[11px] text-zinc-300">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => {
                const newPage = Math.min(page + 1, pagination.totalPages);
                setPage(newPage);
                fetchBookings({ page: newPage });
              }}
              disabled={pagination.page >= pagination.totalPages || loading}
              className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-300 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Cancellation Reason Dialog */}
      {cancelModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5 text-rose-400 font-bold text-lg">
                <Ban className="w-5 h-5 shrink-0" />
                Cancel Reservation
              </div>
              <button
                onClick={() => setCancelModalBooking(null)}
                className="text-zinc-500 hover:text-zinc-300 text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Cancelling booking <span className="font-mono text-white">#{cancelModalBooking._id.slice(-6).toUpperCase()}</span> for{" "}
              <strong className="text-zinc-200">{cancelModalBooking.user?.name}</strong> at{" "}
              <strong className="text-zinc-200">{cancelModalBooking.facility?.name}</strong>.
            </p>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
              ⚠️ <strong>Waitlist Promotion:</strong> If students are waiting for this court slot, the next eligible candidate in the waitlist will automatically be promoted to confirmed status.
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Cancellation Reason (Required)
              </label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g., Facility emergency closure, weather hazard, administrative schedule change..."
                className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-rose-500 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none transition-colors"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalBooking(null)}
                className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-800 rounded-xl transition-colors"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus(cancelModalBooking._id, "CANCELLED", cancelReason)}
                disabled={isSubmittingAction || cancelReason.trim().length < 3}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-lg shadow-rose-600/20"
              >
                {isSubmittingAction ? "Cancelling..." : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Dialog */}
      {rejectModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5 text-zinc-200 font-bold text-lg">
                <X className="w-5 h-5 text-rose-400 shrink-0" />
                Reject Pending Reservation
              </div>
              <button
                onClick={() => setRejectModalBooking(null)}
                className="text-zinc-500 hover:text-zinc-300 text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Rejecting pending request from <strong className="text-zinc-200">{rejectModalBooking.user?.name}</strong> for{" "}
              <strong className="text-zinc-200">{rejectModalBooking.facility?.name}</strong>.
            </p>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Rejection Reason (Optional)
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g., Quota limits reached, conflicting university event, invalid credentials..."
                className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-zinc-500 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none transition-colors"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalBooking(null)}
                className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus(rejectModalBooking._id, "REJECTED", rejectReason)}
                disabled={isSubmittingAction}
                className="px-4 py-2 text-xs font-bold text-white bg-zinc-700 hover:bg-zinc-600 rounded-xl transition-colors"
              >
                {isSubmittingAction ? "Rejecting..." : "Reject Booking"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
