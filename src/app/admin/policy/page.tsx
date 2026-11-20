"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import {
  ShieldCheck,
  Zap,
  Save,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ListOrdered,
  UserX,
  Loader2,
  RefreshCw,
} from "lucide-react";

interface PolicyFormState {
  maxActiveBookings: number;
  maxAdvanceBookingDays: number;
  maxBookingDurationMinutes: number;
  cancellationDeadlineHours: number;
  maxPrimeTimeBookingsPerDay: number;
  primeTimeStart: string;
  primeTimeEnd: string;
  enableWaitlist: boolean;
  enableNoShowTracking: boolean;
}

export default function AdminPolicyPage() {
  const [form, setForm] = useState<PolicyFormState>({
    maxActiveBookings: 2,
    maxAdvanceBookingDays: 7,
    maxBookingDurationMinutes: 60,
    cancellationDeadlineHours: 2,
    maxPrimeTimeBookingsPerDay: 1,
    primeTimeStart: "18:00",
    primeTimeEnd: "21:00",
    enableWaitlist: true,
    enableNoShowTracking: true,
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadPolicy() {
      setLoading(true);
      setErrorMessage(null);
      try {
        const res = await fetch("/api/admin/policy");
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.message || "Failed to load policy configuration");
        }

        if (isMounted && json.policy) {
          setForm({
            maxActiveBookings: json.policy.maxActiveBookings ?? 2,
            maxAdvanceBookingDays: json.policy.maxAdvanceBookingDays ?? 7,
            maxBookingDurationMinutes: json.policy.maxBookingDurationMinutes ?? 60,
            cancellationDeadlineHours: json.policy.cancellationDeadlineHours ?? 2,
            maxPrimeTimeBookingsPerDay: json.policy.maxPrimeTimeBookingsPerDay ?? 1,
            primeTimeStart: json.policy.primeTimeStart || "18:00",
            primeTimeEnd: json.policy.primeTimeEnd || "21:00",
            enableWaitlist: json.policy.enableWaitlist ?? true,
            enableNoShowTracking: json.policy.enableNoShowTracking ?? true,
          });
        }
      } catch (err) {
        if (isMounted) {
          setErrorMessage(err instanceof Error ? err.message : "Error loading policy");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadPolicy();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/admin/policy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "Failed to update policy settings");
      }

      setSuccessMessage(json.message || "Fair-play policies successfully updated!");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Error saving policy");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
      <Navbar />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-[var(--surface)] p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-lime-400/10 border border-lime-400/20 px-3 py-0.5 text-xs font-bold text-lime-400 mb-2">
                <ShieldCheck className="h-3.5 w-3.5" /> Fair Allocation Controls
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight">
                Fair-Play Booking Policies
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-zinc-400">
                Configure campus-wide limits, prime-time fairness quotas, waiting list automation, and no-show policies.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-lime-400/10 border border-lime-400/30 text-lime-400 text-xs font-bold flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-lime-400 animate-pulse" /> Live Enforced
              </span>
            </div>
          </div>
        </div>

        {/* Feedback Messages */}
        {successMessage && (
          <div className="p-4 rounded-2xl border border-lime-400/30 bg-lime-400/10 text-lime-400 text-xs flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center rounded-3xl border border-zinc-800 bg-[var(--surface)] flex flex-col items-center justify-center gap-3">
            <RefreshCw className="h-6 w-6 animate-spin text-lime-400" />
            <span className="text-xs text-zinc-400">Loading current policy parameters...</span>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            {/* Section 1: Quotas and Duration Limits */}
            <div className="rounded-3xl border border-zinc-800 bg-[var(--surface)] p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-2 text-lime-400 text-sm font-bold uppercase tracking-wider border-b border-zinc-800 pb-3">
                <Calendar className="h-4 w-4" /> Quotas & Reservation Windows
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-white mb-1.5">
                    Maximum Active Bookings Per Student
                  </label>
                  <p className="text-[11px] text-zinc-400 mb-2">
                    Concurrent upcoming reservations allowed per account.
                  </p>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={form.maxActiveBookings}
                    onChange={(e) => setForm({ ...form, maxActiveBookings: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-lime-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white mb-1.5">
                    Advance Booking Horizon (Days)
                  </label>
                  <p className="text-[11px] text-zinc-400 mb-2">
                    How far in advance students can reserve court slots.
                  </p>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={form.maxAdvanceBookingDays}
                    onChange={(e) => setForm({ ...form, maxAdvanceBookingDays: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-lime-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white mb-1.5">
                    Max Booking Duration (Minutes)
                  </label>
                  <p className="text-[11px] text-zinc-400 mb-2">
                    Single match reservation length cap.
                  </p>
                  <input
                    type="number"
                    min={15}
                    max={240}
                    step={15}
                    value={form.maxBookingDurationMinutes}
                    onChange={(e) => setForm({ ...form, maxBookingDurationMinutes: parseInt(e.target.value, 10) || 60 })}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-lime-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white mb-1.5">
                    Free Cancellation Window (Hours)
                  </label>
                  <p className="text-[11px] text-zinc-400 mb-2">
                    Hours before start time cancellations are permitted without penalty.
                  </p>
                  <input
                    type="number"
                    min={0}
                    max={24}
                    value={form.cancellationDeadlineHours}
                    onChange={(e) => setForm({ ...form, cancellationDeadlineHours: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-lime-400 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Prime-Time Fair Allocation */}
            <div className="rounded-3xl border border-zinc-800 bg-[var(--surface)] p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-2 text-amber-400 text-sm font-bold uppercase tracking-wider border-b border-zinc-800 pb-3">
                <Zap className="h-4 w-4" /> Prime-Time Anti-Monopoly Rules
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold text-white mb-1.5">
                    Prime-Time Start (24h)
                  </label>
                  <p className="text-[11px] text-zinc-400 mb-2">Evening peak demand onset.</p>
                  <input
                    type="time"
                    value={form.primeTimeStart}
                    onChange={(e) => setForm({ ...form, primeTimeStart: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white mb-1.5">
                    Prime-Time End (24h)
                  </label>
                  <p className="text-[11px] text-zinc-400 mb-2">Evening peak demand conclusion.</p>
                  <input
                    type="time"
                    value={form.primeTimeEnd}
                    onChange={(e) => setForm({ ...form, primeTimeEnd: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white mb-1.5">
                    Max Prime-Time Bookings / Day
                  </label>
                  <p className="text-[11px] text-zinc-400 mb-2">Daily cap per student during peak hours.</p>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={form.maxPrimeTimeBookingsPerDay}
                    onChange={(e) => setForm({ ...form, maxPrimeTimeBookingsPerDay: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Feature Toggles (Waiting List & No-Show Tracking) */}
            <div className="rounded-3xl border border-zinc-800 bg-[var(--surface)] p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-2 text-cyan-400 text-sm font-bold uppercase tracking-wider border-b border-zinc-800 pb-3">
                <ListOrdered className="h-4 w-4" /> Feature Toggles & Automation
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                      <ListOrdered className="h-4 w-4 text-cyan-400" />
                      <span>Waiting List Queue System</span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      Allows students to join queues for fully-booked courts and activates automatic promotion upon cancellations.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.enableWaitlist}
                    onChange={(e) => setForm({ ...form, enableWaitlist: e.target.checked })}
                    className="h-5 w-5 rounded bg-zinc-800 border-zinc-700 text-lime-400 focus:ring-0 mt-1 cursor-pointer"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                      <UserX className="h-4 w-4 text-rose-400" />
                      <span>No-Show & Attendance Tracking</span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      Enables administrators to mark unattended court reservations for fair-play tracking and audit.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.enableNoShowTracking}
                    onChange={(e) => setForm({ ...form, enableNoShowTracking: e.target.checked })}
                    className="h-5 w-5 rounded bg-zinc-800 border-zinc-700 text-lime-400 focus:ring-0 mt-1 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="py-3 px-6 rounded-xl font-bold text-xs bg-lime-400 text-slate-950 hover:bg-lime-300 transition-all shadow-lg shadow-lime-400/10 flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving Policy...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" /> Save Fair-Play Configuration
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
