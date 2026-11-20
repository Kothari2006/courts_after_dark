"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import TeacherDashboardLayout from "@/components/dashboard/TeacherDashboardLayout";
import {
  Trophy,
  Calendar,
  MapPin,
  Users,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Eye,
  CheckSquare,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Send,
  X,
} from "lucide-react";

interface FacilityOption {
  _id: string;
  name: string;
  sportType: string;
  location?: string;
}

interface TournamentMatch {
  matchId: string;
  round: number;
  matchNumber: number;
  team1: string;
  team2: string;
  score1: number;
  score2: number;
  winner?: string | null;
  scheduledTime?: string | null;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED";
}

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
  cancellationReason?: string;
  tournamentMatches?: TournamentMatch[];
  createdAt: string;
}

interface RegistrationRecord {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  teamName?: string;
  teamMembers?: Array<{ name: string; email: string }>;
  status: string;
  attendanceStatus: "REGISTERED" | "ATTENDED" | "NO_SHOW";
  registeredAt: string;
}

interface TeacherEventsClientProps {
  teacher: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  facilities: FacilityOption[];
}

export default function TeacherEventsClient({
  teacher,
  facilities,
}: TeacherEventsClientProps) {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showMatchesModal, setShowMatchesModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  // Attendance state
  const [registrations, setRegistrations] = useState<RegistrationRecord[]>([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [attendanceChanges, setAttendanceChanges] = useState<
    Record<string, "REGISTERED" | "ATTENDED" | "NO_SHOW">
  >({});
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [attendanceMsg, setAttendanceMsg] = useState<string | null>(null);

  // Tournament match creation state
  const [newMatch, setNewMatch] = useState({
    round: 1,
    matchNumber: 1,
    team1: "",
    team2: "",
    scheduledTime: "",
  });
  const [matchError, setMatchError] = useState<string | null>(null);

  // Event creation form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    sportType: "BADMINTON",
    eventType: "TOURNAMENT" as
      | "FRIENDLY_MATCH"
      | "TOURNAMENT"
      | "PRACTICE"
      | "COLLEGE_EVENT",
    facilityId: facilities[0]?._id || "",
    startAt: "",
    endAt: "",
    registrationStartAt: "",
    registrationEndAt: "",
    participantLimit: 16,
    participationType: "INDIVIDUAL" as "INDIVIDUAL" | "TEAM",
    teamSizeLimit: 2,
    rules: "",
    status: "PUBLISHED" as "DRAFT" | "PUBLISHED",
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchMyEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("mine", "true");
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (search.trim()) params.set("search", search.trim());
      params.set("limit", "50");

      const res = await fetch(`/api/events?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setEvents(data.events || []);
      }
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchMyEvents();
  }, [fetchMyEvents]);

  // Handle Create Event
  const handleCreateSubmit = async (publishImmediately: boolean) => {
    setCreateError(null);
    setFormSubmitting(true);

    try {
      const payload = {
        ...formData,
        status: publishImmediately ? "PUBLISHED" : "DRAFT",
        startAt: new Date(formData.startAt).toISOString(),
        endAt: new Date(formData.endAt).toISOString(),
        registrationStartAt: new Date(
          formData.registrationStartAt
        ).toISOString(),
        registrationEndAt: new Date(formData.registrationEndAt).toISOString(),
      };

      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to create event");
      }

      setShowCreateModal(false);
      fetchMyEvents();
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : "Error creating event"
      );
    } finally {
      setFormSubmitting(false);
    }
  };

  // Publish Draft Event
  const handlePublishEvent = async (id: string) => {
    if (!confirm("Are you sure you want to publish this event to students?"))
      return;
    try {
      const res = await fetch(`/api/events/${id}/publish`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) alert(data.message || "Failed to publish event");
      else fetchMyEvents();
    } catch {
      alert("Network error publishing event");
    }
  };

  // Cancel Event
  const handleCancelEvent = async (id: string) => {
    const reason = prompt(
      "Please enter the reason for cancelling this event (participants will be notified):"
    );
    if (!reason || !reason.trim()) return;

    try {
      const res = await fetch(`/api/events/${id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) alert(data.message || "Failed to cancel event");
      else fetchMyEvents();
    } catch {
      alert("Network error cancelling event");
    }
  };

  // Open Attendance Modal
  const openAttendance = async (event: EventItem) => {
    setSelectedEvent(event);
    setShowAttendanceModal(true);
    setLoadingRegistrations(true);
    setAttendanceMsg(null);
    setAttendanceChanges({});

    try {
      const res = await fetch(`/api/events/${event._id}/registrations`);
      const data = await res.json();
      if (res.ok) {
        setRegistrations(data.registrations || []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingRegistrations(false);
    }
  };

  // Save Attendance
  const handleSaveAttendance = async () => {
    if (!selectedEvent) return;
    setSavingAttendance(true);
    setAttendanceMsg(null);

    const records = Object.entries(attendanceChanges).map(
      ([registrationId, status]) => ({
        registrationId,
        status,
      })
    );

    if (records.length === 0) {
      setAttendanceMsg("No changes to save.");
      setSavingAttendance(false);
      return;
    }

    try {
      const res = await fetch(`/api/events/${selectedEvent._id}/attendance`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save attendance");

      setAttendanceMsg("Attendance saved successfully!");
      // reload registrations
      const updated = await fetch(
        `/api/events/${selectedEvent._id}/registrations`
      );
      const updatedData = await updated.json();
      if (updated.ok) setRegistrations(updatedData.registrations || []);
      setAttendanceChanges({});
    } catch (err) {
      setAttendanceMsg(
        err instanceof Error ? err.message : "Error saving attendance"
      );
    } finally {
      setSavingAttendance(false);
    }
  };

  // Open Matches Modal
  const openMatches = (event: EventItem) => {
    setSelectedEvent(event);
    setShowMatchesModal(true);
    setMatchError(null);
  };

  // Create match
  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    setMatchError(null);

    try {
      const res = await fetch(`/api/events/${selectedEvent._id}/matches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMatch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create match");

      // refresh selected event
      const updated = await fetch(`/api/events/${selectedEvent._id}`);
      const updatedData = await updated.json();
      if (updated.ok) {
        setSelectedEvent(updatedData.event);
        fetchMyEvents();
      }
      setNewMatch({
        round: 1,
        matchNumber: (selectedEvent.tournamentMatches?.length || 0) + 1,
        team1: "",
        team2: "",
        scheduledTime: "",
      });
    } catch (err) {
      setMatchError(
        err instanceof Error ? err.message : "Error creating match"
      );
    }
  };

  // Update match score/status
  const handleUpdateMatchScore = async (
    matchId: string,
    score1: number,
    score2: number,
    winner: string | null,
    status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED"
  ) => {
    if (!selectedEvent) return;
    try {
      const res = await fetch(
        `/api/events/${selectedEvent._id}/matches/${matchId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ score1, score2, winner, status }),
        }
      );
      const data = await res.json();
      if (!res.ok) alert(data.message || "Failed to update match");
      else {
        // refresh event
        const updated = await fetch(`/api/events/${selectedEvent._id}`);
        const updatedData = await updated.json();
        if (updated.ok) {
          setSelectedEvent(updatedData.event);
          fetchMyEvents();
        }
      }
    } catch {
      alert("Error updating match");
    }
  };

  return (
    <TeacherDashboardLayout title="Events & Tournaments" activeTab="events">
<div className="w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 mb-1">
              <Trophy className="w-4 h-4" />
              Faculty Event Organizer Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Manage Sports Events & Tournaments
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Host tournaments, single-elimination brackets, and friendly matches
              with automated court collision prevention.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-purple-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            Host New Event
          </button>
        </div>

        {/* Filters */}
        <div className="bg-[var(--surface)] border border-slate-800 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search my events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
            {["ALL", "DRAFT", "PUBLISHED", "REGISTRATION_OPEN", "COMPLETED", "CANCELLED"].map(
              (st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    statusFilter === st
                      ? "bg-purple-600 text-white"
                      : "bg-zinc-900 border border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {st.replace("_", " ")}
                </button>
              )
            )}
          </div>
        </div>

        {/* Event List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-28 rounded-2xl bg-zinc-900/50 border border-slate-800 animate-pulse"
              />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="p-16 rounded-3xl bg-[var(--surface)] border border-slate-800 text-center">
            <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">No events found</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              You haven't organized any events matching this filter.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold"
            >
              Host Your First Event
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((evt) => (
              <div
                key={evt._id}
                className="p-5 rounded-2xl bg-[var(--surface)] border border-slate-800 hover:border-slate-700 transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
                      {evt.sportType}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      {evt.eventType.replace("_", " ")}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                        evt.status === "PUBLISHED" || evt.status === "REGISTRATION_OPEN"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : evt.status === "DRAFT"
                          ? "bg-zinc-800 text-slate-300"
                          : evt.status === "CANCELLED"
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                          : "bg-cyan-500/10 text-cyan-400"
                      }`}
                    >
                      {evt.status.replace("_", " ")}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white">{evt.title}</h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      {evt.facility?.name}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {new Date(evt.startAt).toLocaleDateString("en-US")} (
                      {new Date(evt.startAt).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      )
                    </span>
                    <span className="flex items-center gap-1.5 font-semibold text-slate-200">
                      <Users className="w-3.5 h-3.5 text-purple-400" />
                      {evt.registrationCount} / {evt.participantLimit} Registered
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Link
                    href={`/events/${evt._id}`}
                    className="p-2 rounded-xl bg-zinc-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
                    title="View Public Page"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>

                  {evt.status === "DRAFT" && (
                    <button
                      onClick={() => handlePublishEvent(evt._id)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Publish
                    </button>
                  )}

                  {evt.eventType === "TOURNAMENT" && (
                    <button
                      onClick={() => openMatches(evt)}
                      className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center gap-1"
                    >
                      <Trophy className="w-3.5 h-3.5" />
                      Matches ({evt.tournamentMatches?.length || 0})
                    </button>
                  )}

                  <button
                    onClick={() => openAttendance(evt)}
                    className="px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    Attendance ({evt.registrationCount})
                  </button>

                  {evt.status !== "CANCELLED" && evt.status !== "COMPLETED" && (
                    <button
                      onClick={() => handleCancelEvent(evt._id)}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MODAL: Host / Create Event */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <div className="bg-[var(--surface)] border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 my-8 shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Host Sports Event / Tournament
                    </h3>
                    <p className="text-xs text-slate-400">
                      Reserves facility and verifies availability automatically
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {createError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Event Title
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="e.g. Inter-Department Badminton Championship"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Sport
                    </label>
                    <select
                      value={formData.sportType}
                      onChange={(e) =>
                        setFormData({ ...formData, sportType: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-purple-500"
                    >
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
                    <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Event Type
                    </label>
                    <select
                      value={formData.eventType}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          eventType: e.target.value as any,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-purple-500"
                    >
                      <option value="TOURNAMENT">Tournament (Single Elimination)</option>
                      <option value="FRIENDLY_MATCH">Friendly Match</option>
                      <option value="PRACTICE">Practice & Clinic</option>
                      <option value="COLLEGE_EVENT">College Event</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Facility Venue
                  </label>
                  <select
                    value={formData.facilityId}
                    onChange={(e) =>
                      setFormData({ ...formData, facilityId: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-purple-500"
                  >
                    {facilities.map((f) => (
                      <option key={f._id} value={f._id}>
                        {f.name} ({f.sportType})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Event Start Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.startAt}
                      onChange={(e) =>
                        setFormData({ ...formData, startAt: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Event End Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.endAt}
                      onChange={(e) =>
                        setFormData({ ...formData, endAt: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Registration Starts
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.registrationStartAt}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          registrationStartAt: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Registration Closes
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.registrationEndAt}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          registrationEndAt: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Max Participants / Teams
                    </label>
                    <input
                      type="number"
                      min={2}
                      max={256}
                      value={formData.participantLimit}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          participantLimit: parseInt(e.target.value) || 2,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Participation Mode
                    </label>
                    <select
                      value={formData.participationType}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          participationType: e.target.value as any,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-purple-500"
                    >
                      <option value="INDIVIDUAL">Individual</option>
                      <option value="TEAM">Team</option>
                    </select>
                  </div>

                  {formData.participationType === "TEAM" && (
                    <div>
                      <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                        Team Size Limit
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={formData.teamSizeLimit}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            teamSizeLimit: parseInt(e.target.value) || 1,
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Event Description
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Brief overview of the event..."
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Rules & Requirements
                  </label>
                  <textarea
                    rows={2}
                    value={formData.rules}
                    onChange={(e) =>
                      setFormData({ ...formData, rules: e.target.value })
                    }
                    placeholder="Rules, match format, equipment requirements..."
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-900 text-slate-300 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={formSubmitting}
                  onClick={() => handleCreateSubmit(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-slate-200 text-xs font-semibold disabled:opacity-50"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  disabled={formSubmitting}
                  onClick={() => handleCreateSubmit(true)}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-purple-600/30 disabled:opacity-50"
                >
                  {formSubmitting ? "Creating..." : "Publish Event"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: Attendance Tracking */}
        {showAttendanceModal && selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[var(--surface)] border border-slate-800 rounded-3xl max-w-3xl w-full p-6 sm:p-8 max-h-[90vh] flex flex-col shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-cyan-400" />
                    Attendance Tracking: {selectedEvent.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Total Registrations: {registrations.length}
                  </p>
                </div>
                <button
                  onClick={() => setShowAttendanceModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {attendanceMsg && (
                <div className="p-3 mb-4 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs">
                  {attendanceMsg}
                </div>
              )}

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {loadingRegistrations ? (
                  <div className="text-center py-10 text-xs text-slate-400">
                    Loading participants...
                  </div>
                ) : registrations.length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-400">
                    No participants have registered for this event yet.
                  </div>
                ) : (
                  registrations.map((reg) => {
                    const currentStatus =
                      attendanceChanges[reg._id] || reg.attendanceStatus;

                    return (
                      <div
                        key={reg._id}
                        className="p-3.5 rounded-xl bg-zinc-950 border border-slate-800 flex items-center justify-between gap-4"
                      >
                        <div>
                          <div className="text-sm font-bold text-white">
                            {reg.teamName ? `${reg.teamName} (Team)` : reg.user.name}
                          </div>
                          <div className="text-xs text-slate-400">
                            {reg.user.email} · Registered{" "}
                            {new Date(reg.registeredAt).toLocaleDateString("en-US")}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {(["REGISTERED", "ATTENDED", "NO_SHOW"] as const).map(
                            (st) => (
                              <button
                                key={st}
                                onClick={() =>
                                  setAttendanceChanges({
                                    ...attendanceChanges,
                                    [reg._id]: st,
                                  })
                                }
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                                  currentStatus === st
                                    ? st === "ATTENDED"
                                      ? "bg-emerald-500 text-black font-bold"
                                      : st === "NO_SHOW"
                                      ? "bg-rose-500 text-white font-bold"
                                      : "bg-purple-600 text-white font-bold"
                                    : "bg-zinc-900 text-slate-400 hover:text-slate-200"
                                }`}
                              >
                                {st}
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setShowAttendanceModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-900 text-slate-300 text-xs font-semibold"
                >
                  Close
                </button>
                <button
                  onClick={handleSaveAttendance}
                  disabled={savingAttendance || registrations.length === 0}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase tracking-wider disabled:opacity-50"
                >
                  {savingAttendance ? "Saving..." : "Save Attendance"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: Tournament Matches & Scores */}
        {showMatchesModal && selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[var(--surface)] border border-slate-800 rounded-3xl max-w-3xl w-full p-6 sm:p-8 max-h-[90vh] flex flex-col shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-400" />
                    Tournament Matches: {selectedEvent.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Schedule bracket rounds and update match scores
                  </p>
                </div>
                <button
                  onClick={() => setShowMatchesModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {matchError && (
                <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                  {matchError}
                </div>
              )}

              {/* Existing matches */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-6">
                {(!selectedEvent.tournamentMatches ||
                  selectedEvent.tournamentMatches.length === 0) && (
                  <div className="text-center py-6 text-xs text-slate-400">
                    No matches created yet. Add the opening round matches below.
                  </div>
                )}

                {selectedEvent.tournamentMatches?.map((m) => (
                  <div
                    key={m.matchId}
                    className="p-4 rounded-2xl bg-zinc-950 border border-slate-800 space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                      <span>
                        Round {m.round} · Match #{m.matchNumber}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] ${
                          m.status === "COMPLETED"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : "bg-zinc-800 text-slate-300"
                        }`}
                      >
                        {m.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 items-center">
                      <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-900 border border-slate-800">
                        <span className="text-sm font-semibold text-white truncate mr-2">
                          {m.team1}
                        </span>
                        <input
                          type="number"
                          min={0}
                          defaultValue={m.score1}
                          onBlur={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            handleUpdateMatchScore(
                              m.matchId,
                              val,
                              m.score2,
                              val > m.score2
                                ? m.team1
                                : m.score2 > val
                                ? m.team2
                                : null,
                              m.status
                            );
                          }}
                          className="w-14 px-2 py-1 rounded bg-zinc-950 border border-slate-700 text-center font-bold text-sm text-purple-400"
                        />
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-900 border border-slate-800">
                        <span className="text-sm font-semibold text-white truncate mr-2">
                          {m.team2}
                        </span>
                        <input
                          type="number"
                          min={0}
                          defaultValue={m.score2}
                          onBlur={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            handleUpdateMatchScore(
                              m.matchId,
                              m.score1,
                              val,
                              m.score1 > val
                                ? m.team1
                                : val > m.score1
                                ? m.team2
                                : null,
                              m.status
                            );
                          }}
                          className="w-14 px-2 py-1 rounded bg-zinc-950 border border-slate-700 text-center font-bold text-sm text-purple-400"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-slate-400">
                        {m.winner ? (
                          <span className="text-emerald-400 font-semibold">
                            Winner: {m.winner}
                          </span>
                        ) : (
                          "Match In Progress"
                        )}
                      </span>

                      <div className="flex items-center gap-2">
                        {m.status !== "COMPLETED" && (
                          <button
                            type="button"
                            onClick={() => {
                              const winner =
                                m.score1 > m.score2
                                  ? m.team1
                                  : m.score2 > m.score1
                                  ? m.team2
                                  : null;
                              handleUpdateMatchScore(
                                m.matchId,
                                m.score1,
                                m.score2,
                                winner,
                                "COMPLETED"
                              );
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px]"
                          >
                            Mark Completed
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New Match Form */}
              <form
                onSubmit={handleCreateMatch}
                className="p-4 rounded-2xl bg-zinc-950 border border-slate-800 space-y-3"
              >
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400">
                  Schedule New Match
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400">Round #</label>
                    <input
                      type="number"
                      min={1}
                      value={newMatch.round}
                      onChange={(e) =>
                        setNewMatch({
                          ...newMatch,
                          round: parseInt(e.target.value) || 1,
                        })
                      }
                      className="w-full px-2 py-1.5 rounded-lg bg-zinc-900 border border-slate-800 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Match #</label>
                    <input
                      type="number"
                      min={1}
                      value={newMatch.matchNumber}
                      onChange={(e) =>
                        setNewMatch({
                          ...newMatch,
                          matchNumber: parseInt(e.target.value) || 1,
                        })
                      }
                      className="w-full px-2 py-1.5 rounded-lg bg-zinc-900 border border-slate-800 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Team / Player 1</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Red Dragons"
                      value={newMatch.team1}
                      onChange={(e) =>
                        setNewMatch({ ...newMatch, team1: e.target.value })
                      }
                      className="w-full px-2 py-1.5 rounded-lg bg-zinc-900 border border-slate-800 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Team / Player 2</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Blue Falcons"
                      value={newMatch.team2}
                      onChange={(e) =>
                        setNewMatch({ ...newMatch, team2: e.target.value })
                      }
                      className="w-full px-2 py-1.5 rounded-lg bg-zinc-900 border border-slate-800 text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Match to Bracket
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
</TeacherDashboardLayout>
  );
}
