"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import RoleLayout from "@/components/dashboard/RoleLayout";
import {
  Trophy,
  Calendar,
  MapPin,
  Users,
  Search,
  Filter,
  ArrowRight,
  ShieldAlert,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  UserCheck,
} from "lucide-react";

interface EventItem {
  _id: string;
  title: string;
  description: string;
  sportType: string;
  eventType: "FRIENDLY_MATCH" | "TOURNAMENT" | "PRACTICE" | "COLLEGE_EVENT";
  facility: {
    _id: string;
    name: string;
    sportType?: string;
    location?: string;
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
  participationType: "INDIVIDUAL" | "TEAM";
  teamSizeLimit?: number;
  status: string;
  rules?: string;
  bannerImage?: string | null;
  createdAt: string;
}

const SPORT_OPTIONS = [
  "ALL",
  "BADMINTON",
  "BASKETBALL",
  "FOOTBALL",
  "CRICKET",
  "TENNIS",
  "VOLLEYBALL",
  "TABLE_TENNIS",
];

const EVENT_TYPE_OPTIONS = [
  { value: "ALL", label: "All Types" },
  { value: "TOURNAMENT", label: "Tournaments" },
  { value: "FRIENDLY_MATCH", label: "Friendly Matches" },
  { value: "PRACTICE", label: "Practice & Drills" },
  { value: "COLLEGE_EVENT", label: "College Events" },
];

export default function EventsClient() {
  const { data: session } = useSession();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedSport, setSelectedSport] = useState("ALL");
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "9");
      if (search.trim()) params.set("search", search.trim());
      if (selectedSport !== "ALL") params.set("sportType", selectedSport);
      if (selectedType !== "ALL") params.set("eventType", selectedType);
      if (selectedStatus !== "ALL") params.set("status", selectedStatus);

      const res = await fetch(`/api/events?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to load events");
      }

      setEvents(data.events || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCount(data.pagination?.totalCount || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedSport, selectedType, selectedStatus]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const getStatusBadge = (status: string, regEnd: string) => {
    const isRegClosed = new Date() > new Date(regEnd);

    switch (status) {
      case "REGISTRATION_OPEN":
        return isRegClosed ? (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
            Reg. Closed
          </span>
        ) : (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            Registration Open
          </span>
        );
      case "REGISTRATION_CLOSED":
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
            Reg. Closed
          </span>
        );
      case "ONGOING":
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 animate-pulse">
            Live Now
          </span>
        );
      case "COMPLETED":
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-zinc-500/10 text-zinc-400 border border-zinc-700">
            Completed
          </span>
        );
      case "CANCELLED":
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30">
            Upcoming
          </span>
        );
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "TOURNAMENT":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "FRIENDLY_MATCH":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case "PRACTICE":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/30";
      case "COLLEGE_EVENT":
        return "bg-purple-500/10 text-purple-400 border-purple-500/30";
      default:
        return "bg-zinc-800 text-zinc-300 border-zinc-700";
    }
  };

  return (
    <RoleLayout title="Tournaments & Events">
<div className="w-full">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-purple-950/40 border border-slate-800/80 p-6 sm:p-10 mb-8 shadow-2xl">
          <div className="max-w-2xl relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Courts After Dark Tournaments
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Sports Events & Tournaments
            </h1>
            <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
              Compete in official tournaments, join friendly night matches, and
              represent your department. Instant bracket updates and verified attendance.
            </p>
          </div>
          <div className="absolute right-6 -bottom-8 opacity-10 sm:opacity-20 pointer-events-none">
            <Trophy className="w-64 h-64 text-purple-400" />
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-[var(--surface)] border border-slate-800 rounded-2xl p-4 sm:p-6 mb-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Search event title, rules..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Event Type */}
            <div className="relative">
              <Filter className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
              >
                {EVENT_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                }}
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="REGISTRATION_OPEN">Open For Registration</option>
                <option value="PUBLISHED">Published / Upcoming</option>
                <option value="ONGOING">Live Now</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>

          {/* Sport Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
            {SPORT_OPTIONS.map((sport) => (
              <button
                key={sport}
                onClick={() => {
                  setSelectedSport(sport);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedSport === sport
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                    : "bg-zinc-900 border border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                {sport === "ALL" ? "All Sports" : sport.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-80 rounded-2xl bg-zinc-900/50 border border-slate-800 animate-pulse p-6"
              />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center">
            <ShieldAlert className="w-10 h-10 text-rose-400 mx-auto mb-3" />
            <p className="text-rose-400 font-semibold">{error}</p>
            <button
              onClick={fetchEvents}
              className="mt-4 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold"
            >
              Try Again
            </button>
          </div>
        ) : events.length === 0 ? (
          <div className="p-16 rounded-3xl bg-[var(--surface)] border border-slate-800 text-center">
            <Trophy className="w-14 h-14 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white">No events found</h3>
            <p className="text-slate-400 text-sm mt-1 max-w-sm mx-auto">
              No tournaments or sports events match your filters right now. Try adjusting the search or sport filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((evt) => {
              const capacityPct = Math.min(
                100,
                Math.round((evt.registrationCount / (evt.participantLimit || 1)) * 100)
              );
              const isFull = evt.registrationCount >= evt.participantLimit;

              return (
                <div
                  key={evt._id}
                  className="group relative flex flex-col rounded-2xl bg-[var(--surface)] border border-slate-800 hover:border-purple-500/50 transition-all duration-200 overflow-hidden shadow-lg hover:shadow-purple-500/5"
                >
                  <div className="p-5 flex-1 flex flex-col">
                    {/* Header Badges */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span
                        className={`px-2.5 py-0.5 text-[11px] font-bold rounded-md border ${getTypeBadge(
                          evt.eventType
                        )}`}
                      >
                        {evt.eventType.replace("_", " ")}
                      </span>
                      {getStatusBadge(evt.status, evt.registrationEndAt)}
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-1 mb-1.5">
                      {evt.title}
                    </h3>
                    <p className="text-slate-400 text-xs line-clamp-2 mb-4 leading-relaxed">
                      {evt.description}
                    </p>

                    {/* Event Meta Details */}
                    <div className="space-y-2 mt-auto text-xs text-slate-300">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span className="truncate">{evt.facility?.name || "Campus Facility"}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          {new Date(evt.startAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          ·{" "}
                          {new Date(evt.startAt).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          -{" "}
                          {new Date(evt.endAt).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          {evt.participationType === "TEAM"
                            ? `Team (${evt.teamSizeLimit || "Multi"}-player)`
                            : "Individual Registration"}
                        </span>
                      </div>
                    </div>

                    {/* Capacity Indicator */}
                    <div className="mt-4 pt-4 border-t border-slate-800/80">
                      <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 mb-1.5">
                        <span>Capacity Filled</span>
                        <span className={isFull ? "text-rose-400 font-bold" : "text-slate-200"}>
                          {evt.registrationCount} / {evt.participantLimit} ({capacityPct}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isFull
                              ? "bg-rose-500"
                              : capacityPct > 75
                              ? "bg-amber-400"
                              : "bg-purple-500"
                          }`}
                          style={{ width: `${capacityPct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card Action Button */}
                  <div className="p-4 bg-zinc-950/60 border-t border-slate-800/60">
                    <Link
                      href={`/events/${evt._id}`}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 text-xs font-semibold transition-all duration-150"
                    >
                      <span>View Details & Register</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-xl bg-zinc-900 border border-slate-800 text-slate-300 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-400 font-medium">
              Page {page} of {totalPages} ({totalCount} events)
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-xl bg-zinc-900 border border-slate-800 text-slate-300 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
</RoleLayout>
  );
}
