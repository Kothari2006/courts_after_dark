"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  Trophy,
  Calendar,
  MapPin,
  Users,
  Search,
  Filter,
  ShieldAlert,
  Eye,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Activity,
  CheckCircle2,
} from "lucide-react";

interface AdminEventItem {
  _id: string;
  title: string;
  description: string;
  sportType: string;
  eventType: string;
  facility: {
    _id: string;
    name: string;
    sportType?: string;
  };
  organizer: {
    _id: string;
    name: string;
    email: string;
  };
  startAt: string;
  endAt: string;
  registrationStartAt: string;
  registrationEndAt: string;
  participantLimit: number;
  registrationCount: number;
  participationType: string;
  status: string;
  cancellationReason?: string;
  createdAt: string;
}

interface AdminEventsClientProps {
  initialEvents: AdminEventItem[];
  initialPagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
  initialMetrics: {
    totalEvents: number;
    publishedEvents: number;
    totalRegistrations: number;
    tournaments: number;
  };
  facilities: Array<{ _id: string; name: string; sportType: string }>;
}

export default function AdminEventsClient({
  initialEvents,
  initialPagination,
  initialMetrics,
  facilities,
}: AdminEventsClientProps) {
  const [events, setEvents] = useState<AdminEventItem[]>(initialEvents);
  const [pagination, setPagination] = useState(initialPagination);
  const [metrics, setMetrics] = useState(initialMetrics);
  const [loading, setLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [sportType, setSportType] = useState("ALL");
  const [eventType, setEventType] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [facilityId, setFacilityId] = useState("ALL");

  const fetchEvents = useCallback(async (targetPage = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", targetPage.toString());
      params.set("limit", "10");
      if (search.trim()) params.set("search", search.trim());
      if (sportType !== "ALL") params.set("sportType", sportType);
      if (eventType !== "ALL") params.set("eventType", eventType);
      if (status !== "ALL") params.set("status", status);
      if (facilityId !== "ALL") params.set("facilityId", facilityId);

      const res = await fetch(`/api/admin/events?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setEvents(data.events || []);
        setPagination(
          data.pagination || {
            page: 1,
            limit: 10,
            totalCount: 0,
            totalPages: 1,
          }
        );
        if (data.metrics) setMetrics(data.metrics);
      }
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, [search, sportType, eventType, status, facilityId]);

  useEffect(() => {
    fetchEvents(1);
  }, [fetchEvents]);

  const handleAdminCancel = async (id: string) => {
    const reason = prompt(
      "Admin Action: Enter mandatory cancellation reason (notifies organizer and participants):"
    );
    if (!reason || !reason.trim()) return;

    try {
      const res = await fetch(`/api/events/${id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Failed to cancel event");
      } else {
        alert("Event cancelled and court released.");
        fetchEvents(pagination.page);
      }
    } catch {
      alert("Error cancelling event");
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 mb-1">
          <Trophy className="w-4 h-4" />
          Platform Administration
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Campus Sports Events & Tournaments
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Monitor campus-wide sporting events, tournament schedules, registration capacity, and facility reservations.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[var(--surface)] border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Total Events</span>
            <Trophy className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">
            {metrics.totalEvents}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--surface)] border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Tournaments</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-400">
            {metrics.tournaments}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--surface)] border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Active / Open</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
            {metrics.publishedEvents}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--surface)] border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Total Athletes</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-cyan-400">
            {metrics.totalRegistrations}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[var(--surface)] border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search title, rules..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <select
              value={sportType}
              onChange={(e) => setSportType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500"
            >
              <option value="ALL">All Sports</option>
              <option value="BADMINTON">Badminton</option>
              <option value="BASKETBALL">Basketball</option>
              <option value="FOOTBALL">Football</option>
              <option value="CRICKET">Cricket</option>
              <option value="TENNIS">Tennis</option>
              <option value="VOLLEYBALL">Volleyball</option>
              <option value="TABLE_TENNIS">Table Tennis</option>
            </select>
          </div>

          <div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="REGISTRATION_OPEN">Registration Open</option>
              <option value="REGISTRATION_CLOSED">Registration Closed</option>
              <option value="ONGOING">Ongoing</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div>
            <select
              value={facilityId}
              onChange={(e) => setFacilityId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500"
            >
              <option value="ALL">All Facilities</option>
              {facilities.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-[var(--surface)] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Event Details</th>
                <th className="py-3 px-4">Organizer</th>
                <th className="py-3 px-4">Facility Venue</th>
                <th className="py-3 px-4">Event Schedule</th>
                <th className="py-3 px-4">Registrations</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    Loading campus events...
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No sports events found matching current criteria.
                  </td>
                </tr>
              ) : (
                events.map((evt) => (
                  <tr
                    key={evt._id}
                    className="hover:bg-zinc-900/40 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-sm">
                        {evt.title}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
                          {evt.sportType}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          {evt.eventType.replace("_", " ")}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-200">
                        {evt.organizer?.name || "Teacher"}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {evt.organizer?.email}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-300 font-medium">
                      {evt.facility?.name}
                    </td>

                    <td className="py-3.5 px-4 text-slate-300">
                      <div>{new Date(evt.startAt).toLocaleDateString("en-US")}</div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(evt.startAt).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        -{" "}
                        {new Date(evt.endAt).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-200">
                      {evt.registrationCount} / {evt.participantLimit}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                          evt.status === "PUBLISHED" ||
                          evt.status === "REGISTRATION_OPEN"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : evt.status === "CANCELLED"
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                            : "bg-zinc-800 text-slate-300"
                        }`}
                      >
                        {evt.status.replace("_", " ")}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/events/${evt._id}`}
                          className="p-1.5 rounded-lg bg-zinc-900 border border-slate-800 text-slate-300 hover:text-white"
                          title="View Public Page"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>

                        {evt.status !== "CANCELLED" && (
                          <button
                            onClick={() => handleAdminCancel(evt._id)}
                            className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-semibold text-[11px]"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              Showing page {pagination.page} of {pagination.totalPages} (
              {pagination.totalCount} events)
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchEvents(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-1.5 rounded-lg bg-zinc-900 border border-slate-800 text-slate-300 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => fetchEvents(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="p-1.5 rounded-lg bg-zinc-900 border border-slate-800 text-slate-300 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
