"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import RoleLayout from "@/components/dashboard/RoleLayout";
import {
  Trophy,
  Calendar,
  MapPin,
  Users,
  Clock,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserCheck,
  Plus,
  Trash2,
  ShieldAlert,
} from "lucide-react";

interface TeamMember {
  name: string;
  email: string;
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

interface EventDetail {
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
    courtCount?: number;
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
  tournamentMatches?: TournamentMatch[];
  myRegistration?: {
    _id: string;
    teamName?: string;
    teamMembers?: TeamMember[];
    status: string;
    attendanceStatus: string;
    registeredAt: string;
  } | null;
}

export default function EventDetailClient({ eventId }: { eventId: string }) {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const user = session?.user;

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states for team registration
  const [teamName, setTeamName] = useState("");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { name: "", email: "" },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const fetchEvent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${eventId}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to load event details");
      }
      setEvent(data.event);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching event");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  const handleAddMember = () => {
    const limit = (event?.teamSizeLimit || 5) - 1; // excluding captain/creator
    if (teamMembers.length < limit) {
      setTeamMembers([...teamMembers, { name: "", email: "" }]);
    }
  };

  const handleRemoveMember = (idx: number) => {
    setTeamMembers(teamMembers.filter((_, i) => i !== idx));
  };

  const handleMemberChange = (
    idx: number,
    field: "name" | "email",
    val: string
  ) => {
    const copy = [...teamMembers];
    copy[idx][field] = val;
    setTeamMembers(copy);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setIsSubmitting(true);

    try {
      const payload: {
        teamName?: string;
        teamMembers?: TeamMember[];
      } = {};

      if (event?.participationType === "TEAM") {
        if (!teamName.trim()) {
          setFormError("Team name is required");
          setIsSubmitting(false);
          return;
        }
        payload.teamName = teamName.trim();

        const validMembers = teamMembers.filter(
          (m) => m.name.trim() && m.email.trim()
        );
        payload.teamMembers = validMembers;
      }

      const res = await fetch(`/api/events/${eventId}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Registration failed");
      }

      setFormSuccess("Successfully registered for this event!");
      fetchEvent();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Registration error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (
      !confirm(
        "Are you sure you want to cancel your registration? Your spot will be released immediately."
      )
    ) {
      return;
    }

    setFormError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/events/${eventId}/register`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to cancel registration");
      }

      setFormSuccess("Your registration was cancelled.");
      fetchEvent();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Cancellation error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <RoleLayout title="Event Details">
<div className="min-h-[50vh] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
        </div>
</RoleLayout>
    );
  }

  if (error || !event) {
    return (
      <RoleLayout title="Event Details">
<div className="min-h-[50vh] flex flex-col items-center justify-center text-center">
          <ShieldAlert className="w-14 h-14 text-rose-500 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Event Not Found</h2>
          <p className="text-slate-400 text-sm mb-6">{error || "This event is unavailable."}</p>
          <Link
            href="/events"
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold"
          >
            Back to Events
          </Link>
        </div>
</RoleLayout>
    );
  }

  const now = new Date();
  const regStart = new Date(event.registrationStartAt);
  const regEnd = new Date(event.registrationEndAt);
  const isRegOpen =
    now >= regStart &&
    now <= regEnd &&
    (event.status === "REGISTRATION_OPEN" || event.status === "PUBLISHED");
  const isFull = event.registrationCount >= event.participantLimit;

  return (
    <RoleLayout title="Event Details">
<div className="w-full">
        {/* Back Link */}
        <Link
          href="/events"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Events Catalog
        </Link>

        {/* Top Header Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Main Info (Left 2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[var(--surface)] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
              <div className="flex flex-wrap items-center gap-2.5 mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
                  {event.sportType}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  {event.eventType.replace("_", " ")}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {event.status.replace("_", " ")}
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
                {event.title}
              </h1>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                {event.description}
              </p>

              {/* Timing & Facility Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 pt-6 border-t border-slate-800">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Event Schedule
                    </h4>
                    <p className="text-sm font-semibold text-white mt-1">
                      {new Date(event.startAt).toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(event.startAt).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      -{" "}
                      {new Date(event.endAt).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Venue / Facility
                    </h4>
                    <p className="text-sm font-semibold text-white mt-1">
                      {event.facility?.name || "Campus Court"}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {event.facility?.location || "Main Campus Sports Complex"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Rules & Guidelines */}
            <div className="bg-[var(--surface)] border border-slate-800 rounded-3xl p-6 sm:p-8">
              <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                Tournament Rules & Guidelines
              </h3>
              <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-line bg-zinc-950/60 p-4 rounded-2xl border border-slate-800">
                {event.rules ||
                  "Standard college intramural athletic guidelines apply. Players must arrive in proper sports attire with verified university student IDs. Referees' decisions are final."}
              </div>
            </div>

            {/* Tournament Bracket / Matches View (if tournament) */}
            {event.eventType === "TOURNAMENT" &&
              event.tournamentMatches &&
              event.tournamentMatches.length > 0 && (
                <div className="bg-[var(--surface)] border border-slate-800 rounded-3xl p-6 sm:p-8">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-purple-400" />
                    Tournament Matches & Scores
                  </h3>
                  <div className="space-y-3">
                    {event.tournamentMatches.map((m) => (
                      <div
                        key={m.matchId}
                        className="p-4 rounded-2xl bg-zinc-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4"
                      >
                        <div className="text-xs font-bold uppercase tracking-wider text-purple-400">
                          Round {m.round} · Match #{m.matchNumber}
                        </div>
                        <div className="flex items-center gap-4 text-sm font-bold text-white">
                          <span
                            className={
                              m.winner === m.team1
                                ? "text-emerald-400 font-extrabold"
                                : ""
                            }
                          >
                            {m.team1} ({m.score1})
                          </span>
                          <span className="text-slate-500 font-normal">vs</span>
                          <span
                            className={
                              m.winner === m.team2
                                ? "text-emerald-400 font-extrabold"
                                : ""
                            }
                          >
                            {m.team2} ({m.score2})
                          </span>
                        </div>
                        <div className="text-xs">
                          {m.status === "COMPLETED" ? (
                            <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
                              Winner: {m.winner || "Tied"}
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-md bg-zinc-800 text-slate-300">
                              {m.status}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>

          {/* Right Column: Registration Card & Organizer info */}
          <div className="space-y-6">
            <div className="bg-[var(--surface)] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-4">
                Registration Status
              </h3>

              {/* Progress */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-2">
                  <span>Spots Filled</span>
                  <span className="text-white font-bold">
                    {event.registrationCount} / {event.participantLimit}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-purple-500 transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        100,
                        (event.registrationCount / event.participantLimit) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Reg Window */}
              <div className="p-3.5 rounded-2xl bg-zinc-950 border border-slate-800 text-xs space-y-1.5 mb-6">
                <div className="flex justify-between text-slate-400">
                  <span>Registration Opens:</span>
                  <span className="text-slate-200">
                    {new Date(event.registrationStartAt).toLocaleDateString("en-US")}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Registration Closes:</span>
                  <span className="text-slate-200">
                    {new Date(event.registrationEndAt).toLocaleDateString("en-US")}
                  </span>
                </div>
              </div>

              {/* Status & Feedback messages */}
              {formError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                  {formError}
                </div>
              )}

              {formSuccess && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
                  {formSuccess}
                </div>
              )}

              {/* Logged in state check */}
              {authStatus !== "authenticated" ? (
                <div className="text-center py-4">
                  <p className="text-xs text-slate-400 mb-3">
                    Sign in with your university account to register.
                  </p>
                  <Link
                    href={`/login?callbackUrl=/events/${event._id}`}
                    className="w-full inline-block py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs text-center"
                  >
                    Sign In to Register
                  </Link>
                </div>
              ) : event.myRegistration ? (
                /* Already Registered View */
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 space-y-3">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>You are registered!</span>
                  </div>

                  {event.myRegistration.teamName && (
                    <div className="text-xs text-slate-300">
                      <span className="font-semibold text-white">Team:</span>{" "}
                      {event.myRegistration.teamName}
                    </div>
                  )}

                  <div className="text-xs text-slate-300">
                    <span className="font-semibold text-white">Attendance:</span>{" "}
                    {event.myRegistration.attendanceStatus}
                  </div>

                  {new Date() < regEnd && (
                    <button
                      onClick={handleCancelRegistration}
                      disabled={isSubmitting}
                      className="w-full mt-2 py-2 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 text-xs font-semibold disabled:opacity-50"
                    >
                      {isSubmitting ? "Cancelling..." : "Cancel Registration"}
                    </button>
                  )}
                </div>
              ) : isFull ? (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-center text-xs font-semibold">
                  Event capacity is full.
                </div>
              ) : !isRegOpen ? (
                <div className="p-4 rounded-2xl bg-zinc-900 border border-slate-800 text-slate-400 text-center text-xs">
                  Registration is currently closed for this event.
                </div>
              ) : user?.role !== "STUDENT" ? (
                <div className="p-4 rounded-2xl bg-zinc-900 border border-slate-800 text-slate-400 text-center text-xs">
                  Event registration is open to students. You are logged in as {user?.role}.
                </div>
              ) : (
                /* Registration Form */
                <form onSubmit={handleRegister} className="space-y-4">
                  {event.participationType === "TEAM" && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                          Team Name
                        </label>
                        <input
                          type="text"
                          required
                          value={teamName}
                          onChange={(e) => setTeamName(e.target.value)}
                          placeholder="e.g. Dark Knights"
                          className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                            Team Members
                          </label>
                          {teamMembers.length <
                            (event.teamSizeLimit || 5) - 1 && (
                            <button
                              type="button"
                              onClick={handleAddMember}
                              className="text-[11px] font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" /> Add Member
                            </button>
                          )}
                        </div>

                        <div className="space-y-2">
                          {teamMembers.map((member, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                              <input
                                type="text"
                                placeholder={`Member ${idx + 2} Name`}
                                value={member.name}
                                onChange={(e) =>
                                  handleMemberChange(idx, "name", e.target.value)
                                }
                                className="w-1/2 px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-slate-800 text-xs text-slate-200"
                              />
                              <input
                                type="email"
                                placeholder="University Email"
                                value={member.email}
                                onChange={(e) =>
                                  handleMemberChange(idx, "email", e.target.value)
                                }
                                className="w-1/2 px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-slate-800 text-xs text-slate-200"
                              />
                              {teamMembers.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMember(idx)}
                                  className="p-1.5 text-slate-500 hover:text-rose-400"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50"
                  >
                    {isSubmitting
                      ? "Registering..."
                      : event.participationType === "TEAM"
                      ? "Register Team"
                      : "Confirm Registration"}
                  </button>
                </form>
              )}
            </div>

            {/* Organizer Card */}
            <div className="bg-[var(--surface)] border border-slate-800 rounded-3xl p-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Event Organizer
              </h4>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                  {event.organizer?.name?.[0] || "T"}
                </div>
                <div>
                  <h5 className="text-sm font-bold text-white">
                    {event.organizer?.name || "Faculty Coordinator"}
                  </h5>
                  <p className="text-xs text-slate-400">
                    {event.organizer?.email}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
</RoleLayout>
  );
}
