"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import BookingCard, { BookingItem } from "@/components/dashboard/BookingCard";
import EmptyState from "@/components/dashboard/EmptyState";
import {
  CalendarDays,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  X,
  Loader2,
  Trash2,
  ListOrdered,
  Calendar,
  Clock,
  MapPin,
  Star,
  CheckCircle2,
  MessageSquare,
} from "lucide-react";
import ReviewModal from "@/components/reviews/ReviewModal";
import { cn } from "@/lib/utils";

interface QuotaInfo {
  activeCount: number;
  maxActive: number;
  remaining: number;
}

interface WaitlistRecord {
  _id: string;
  facility: {
    _id: string;
    name: string;
    sportType: string;
    location?: string;
  };
  requestedDate: string;
  startAt: string;
  endAt: string;
  position: number;
  status: "WAITING" | "PROMOTED" | "CANCELLED" | "EXPIRED";
  createdAt: string;
}

type BookingTab = "ALL" | "UPCOMING" | "COMPLETED" | "CANCELLED" | "WAITLIST" | "REVIEWS";
const TAB_LABELS: Record<BookingTab, string> = {
  ALL: "",
  UPCOMING: "upcoming ",
  COMPLETED: "completed ",
  CANCELLED: "cancelled ",
  WAITLIST: "waitlist ",
  REVIEWS: "",
};

export default function BookingsPage() {
  return (
    <Suspense fallback={null}>
      <BookingsContent />
    </Suspense>
  );
}

function BookingsContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTabState] = useState<BookingTab>(
    tabParam?.toUpperCase() === "WAITLIST" ? "WAITLIST" : "ALL"
  );
  // Keep the tab in sync when the sidebar link (?tab=waitlist) changes the URL.
  const [prevTabParam, setPrevTabParam] = useState(tabParam);
  if (tabParam !== prevTabParam) {
    setPrevTabParam(tabParam);
    setActiveTabState(tabParam?.toUpperCase() === "WAITLIST" ? "WAITLIST" : "ALL");
  }
  const setActiveTab = (tab: BookingTab) => {
    setActiveTabState(tab);
    // Reflect waitlist tab in the URL so the sidebar highlight stays correct.
    window.history.replaceState(null, "", tab === "WAITLIST" ? "/bookings?tab=waitlist" : "/bookings");
    setPrevTabParam(tab === "WAITLIST" ? "waitlist" : null);
  };
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistRecord[]>([]);
  const [quota, setQuota] = useState<QuotaInfo>({ activeCount: 0, maxActive: 2, remaining: 2 });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Review state
  const [reviewModalBooking, setReviewModalBooking] = useState<{ id: string; facilityName: string } | null>(null);
  const [eligibleReviewBookings, setEligibleReviewBookings] = useState<any[]>([]);
  const [myReviews, setMyReviews] = useState<any[]>([]);

  // Cancellation Modal state
  const [cancellingBooking, setCancellingBooking] = useState<BookingItem | null>(null);
  const [cancellationReason, setCancellationReason] = useState<string>("");
  const [cancellingInProgress, setCancellingInProgress] = useState<boolean>(false);
  const [cancellationError, setCancellationError] = useState<string | null>(null);

  // Leaving Waitlist state
  const [leavingWaitlistId, setLeavingWaitlistId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        if (activeTab === "REVIEWS") {
          const [eligibleRes, myRes] = await Promise.all([
            fetch("/api/reviews/eligible-bookings"),
            fetch("/api/reviews/my"),
          ]);
          const eligibleData = await eligibleRes.json();
          const myData = await myRes.json();
          if (isMounted) {
            setEligibleReviewBookings(eligibleData.eligibleBookings || []);
            setMyReviews(myData.reviews || []);
          }
        } else if (activeTab === "WAITLIST") {
          const res = await fetch("/api/waitlist/my");
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || "Failed to load waiting list entries");
          if (isMounted) {
            setWaitlistEntries(data.entries || []);
          }
        } else {
          const res = await fetch(`/api/bookings/my?filter=${activeTab}&limit=50`);
          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.message || "Failed to load bookings");
          }

          const now = Date.now();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mappedBookings: BookingItem[] = (data.bookings || []).map((b: any) => {
            const d = new Date(b.bookingDate);
            const formattedDate = !isNaN(d.getTime())
              ? d.toLocaleDateString("en-US", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })
              : b.startTime;

            const startMs = new Date(b.startAt).getTime();
            const canCancel =
              (b.status === "CONFIRMED" || b.status === "PENDING") &&
              startMs - now >= 2 * 60 * 60 * 1000;

            return {
              id: b._id,
              facilityName: b.facility?.name || "Facility",
              sportType: b.facility?.sportType || "OTHER",
              location: b.facility?.location || "",
              bookingDate: formattedDate,
              startTime: b.startTime,
              endTime: b.endTime,
              startAt: b.startAt,
              endAt: b.endAt,
              status: b.status,
              bookingType: b.bookingType,
              attendanceStatus: b.attendanceStatus,
              cancellationReason: b.cancellationReason,
              cancelledAt: b.cancelledAt,
              canCancel,
            };
          });

          if (isMounted) {
            setBookings(mappedBookings);
            if (data.quota) {
              setQuota(data.quota);
            }
          }
        }
      } catch (err) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : "Error retrieving data";
          setError(msg);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [activeTab, refreshTrigger]);

  const handleOpenCancelModal = (booking: BookingItem) => {
    setCancellingBooking(booking);
    setCancellationReason("");
    setCancellationError(null);
  };

  const handleConfirmCancel = async () => {
    if (!cancellingBooking) return;

    setCancellingInProgress(true);
    setCancellationError(null);

    try {
      const res = await fetch(`/api/bookings/${cancellingBooking.id}/cancel`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancellationReason }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "Failed to cancel booking");
      }

      setCancellingBooking(null);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error cancelling booking";
      setCancellationError(msg);
    } finally {
      setCancellingInProgress(false);
    }
  };

  const handleLeaveWaitlist = async (waitlistId: string) => {
    setLeavingWaitlistId(waitlistId);
    try {
      const res = await fetch(`/api/waitlist/${waitlistId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to leave waiting list");
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error leaving waiting list");
    } finally {
      setLeavingWaitlistId(null);
    }
  };

  return (
    <DashboardLayout title="My Bookings">
      <div className="space-y-8">
        {/* Header Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-[var(--surface)] p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-lime-400/10 border border-lime-400/20 px-3 py-0.5 text-xs font-bold text-lime-400 mb-2">
                <CalendarDays className="h-3 w-3" /> Court Reservations
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                My Bookings & Match History
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-400 leading-relaxed">
                Track your active court reservations, monitor waiting list queues, and manage fair-play limits.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 bg-slate-900 border border-slate-800 p-3 rounded-2xl">
                <ShieldCheck className="h-5 w-5 text-lime-400 shrink-0" />
                <div className="text-xs">
                  <span className="font-bold text-white block">
                    Active Quota: {quota.activeCount}/{quota.maxActive}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {quota.remaining} slots remaining
                  </span>
                </div>
              </div>

              <button
                onClick={() => setRefreshTrigger((prev) => prev + 1)}
                disabled={loading}
                title="Refresh Bookings"
                className="p-3 rounded-2xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors"
              >
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin text-lime-400")} />
              </button>
            </div>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab("ALL")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all border shrink-0",
              activeTab === "ALL"
                ? "bg-lime-400 text-slate-950 border-lime-400 shadow-md shadow-lime-400/10"
                : "bg-[var(--surface)] text-slate-400 border-slate-800 hover:text-white"
            )}
          >
            All Bookings
          </button>
          <button
            onClick={() => setActiveTab("UPCOMING")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all border shrink-0",
              activeTab === "UPCOMING"
                ? "bg-lime-400 text-slate-950 border-lime-400 shadow-md shadow-lime-400/10"
                : "bg-[var(--surface)] text-slate-400 border-slate-800 hover:text-white"
            )}
          >
            Upcoming
          </button>
          <button
            onClick={() => setActiveTab("COMPLETED")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all border shrink-0",
              activeTab === "COMPLETED"
                ? "bg-lime-400 text-slate-950 border-lime-400 shadow-md shadow-lime-400/10"
                : "bg-[var(--surface)] text-slate-400 border-slate-800 hover:text-white"
            )}
          >
            Completed
          </button>
          <button
            onClick={() => setActiveTab("CANCELLED")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all border shrink-0",
              activeTab === "CANCELLED"
                ? "bg-lime-400 text-slate-950 border-lime-400 shadow-md shadow-lime-400/10"
                : "bg-[var(--surface)] text-slate-400 border-slate-800 hover:text-white"
            )}
          >
            Cancelled
          </button>
          <button
            onClick={() => setActiveTab("WAITLIST")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 flex items-center gap-1.5",
              activeTab === "WAITLIST"
                ? "bg-cyan-400 text-slate-950 border-cyan-400 shadow-md shadow-cyan-400/10"
                : "bg-[var(--surface)] text-cyan-400 border-cyan-500/30 hover:border-cyan-400"
            )}
          >
            <ListOrdered className="h-3.5 w-3.5" /> Waiting List ({waitlistEntries.length})
          </button>
          <button
            onClick={() => setActiveTab("REVIEWS")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 flex items-center gap-1.5",
              activeTab === "REVIEWS"
                ? "bg-amber-400 text-slate-950 border-amber-400 shadow-md shadow-amber-400/10"
                : "bg-[var(--surface)] text-amber-400 border-amber-500/30 hover:border-amber-400"
            )}
          >
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> Reviews & Ratings
          </button>
        </div>

        {/* Content */}
        {error ? (
          <div className="p-8 text-center rounded-2xl border border-rose-500/20 bg-rose-500/5">
            <p className="text-sm font-bold text-rose-400 mb-1">Failed to load records</p>
            <p className="text-xs text-slate-400">{error}</p>
            <button
              onClick={() => setRefreshTrigger((prev) => prev + 1)}
              className="mt-4 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-white"
            >
              Retry
            </button>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-48 rounded-2xl border border-slate-800 bg-[var(--surface)] animate-pulse p-5 space-y-3"
              >
                <div className="h-4 bg-slate-800 rounded w-1/3" />
                <div className="h-6 bg-slate-800 rounded w-3/4" />
                <div className="h-16 bg-slate-900 rounded" />
              </div>
            ))}
          </div>
        ) : activeTab === "WAITLIST" ? (
          waitlistEntries.length === 0 ? (
            <EmptyState
              icon={ListOrdered} art="list"
              title="You are not on any waiting lists"
              description="When a court slot is fully booked, you can join the waiting list from the facility schedule page."
              actionHref="/facilities"
              actionLabel="Discover Facilities"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {waitlistEntries.map((entry) => {
                const startDate = new Date(entry.startAt);
                const endDate = new Date(entry.endAt);
                const timeString = `${String(startDate.getUTCHours()).padStart(2, "0")}:${String(startDate.getUTCMinutes()).padStart(2, "0")} - ${String(endDate.getUTCHours()).padStart(2, "0")}:${String(endDate.getUTCMinutes()).padStart(2, "0")}`;

                return (
                  <div
                    key={entry._id}
                    className="overflow-hidden rounded-2xl border border-slate-800/80 bg-[var(--surface)] p-5 shadow-lg flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                        <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                          {entry.facility?.sportType || "COURT"}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-400/10 text-cyan-400 border border-cyan-400/30">
                            Queue #{entry.position}
                          </span>
                          <span
                            className={cn(
                              "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
                              entry.status === "PROMOTED"
                                ? "bg-lime-400/10 text-lime-400 border-lime-400/30"
                                : "bg-amber-400/10 text-amber-400 border-amber-400/30"
                            )}
                          >
                            {entry.status}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4">
                        <h4 className="text-base font-bold text-white">{entry.facility?.name}</h4>
                        {entry.facility?.location && (
                          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                            <MapPin className="h-3.5 w-3.5 text-slate-500" />
                            <span>{entry.facility.location}</span>
                          </p>
                        )}
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-900/60 border border-slate-800/60 p-3 text-xs">
                        <div className="flex items-center gap-2 text-slate-300">
                          <Calendar className="h-4 w-4 text-cyan-400 shrink-0" />
                          <div>
                            <span className="text-[10px] text-slate-500 block uppercase">Date</span>
                            <span className="font-semibold text-slate-200">
                              {new Date(entry.requestedDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-slate-300">
                          <Clock className="h-4 w-4 text-cyan-400 shrink-0" />
                          <div>
                            <span className="text-[10px] text-slate-500 block uppercase">Time Window</span>
                            <span className="font-semibold text-slate-200">{timeString}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {entry.status === "WAITING" && (
                      <div className="mt-4 pt-3 border-t border-slate-800/80">
                        <button
                          type="button"
                          disabled={leavingWaitlistId === entry._id}
                          onClick={() => handleLeaveWaitlist(entry._id)}
                          className="w-full py-2 px-3 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                        >
                          {leavingWaitlistId === entry._id ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Leaving Queue...
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-3.5 w-3.5" /> Leave Waiting List
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        ) : activeTab === "REVIEWS" ? (
          <div className="space-y-8">
            {/* Section 1: Leave a Review for Eligible Bookings */}
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-400 fill-amber-400" /> Leave a Review
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Completed court sessions eligible for your player feedback.
                </p>
              </div>

              {eligibleReviewBookings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {eligibleReviewBookings.map((b) => (
                    <div
                      key={b._id}
                      className="p-5 rounded-2xl border border-slate-800 bg-[var(--surface)] space-y-3 flex flex-col justify-between"
                    >
                      <div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-lime-400/10 text-lime-400 border border-lime-400/20 uppercase">
                          {b.facility?.sportType || "COURT"}
                        </span>
                        <h4 className="text-base font-bold text-white mt-2">
                          {b.facility?.name}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1">
                          Played on {new Date(b.bookingDate).toLocaleDateString("en-US")} ({b.startTime} - {b.endTime})
                        </p>
                      </div>

                      <button
                        onClick={() =>
                          setReviewModalBooking({
                            id: b._id,
                            facilityName: b.facility?.name || "Facility",
                          })
                        }
                        className="w-full py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-400/10 transition-all"
                      >
                        <Star className="h-4 w-4 fill-slate-950" /> Rate & Review Court
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-2xl border border-slate-800 bg-[var(--surface)]/60 text-center text-xs text-slate-400">
                  No completed sessions awaiting your review. Completed bookings will appear here automatically.
                </div>
              )}
            </div>

            {/* Section 2: My Past Reviews */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                My Previously Submitted Reviews ({myReviews.length})
              </h3>

              {myReviews.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myReviews.map((r) => (
                    <div
                      key={r._id}
                      className="p-5 rounded-2xl border border-slate-800 bg-[var(--app-bg)] space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-white">
                          {r.facility?.name}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                            r.status === "APPROVED"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : r.status === "REJECTED"
                              ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          }`}
                        >
                          {r.status === "APPROVED"
                            ? "✓ Published"
                            : r.status === "REJECTED"
                            ? "✕ Rejected"
                            : "⏳ Pending Approval"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`h-3.5 w-3.5 ${
                              r.rating >= s
                                ? "fill-lime-400 text-lime-400"
                                : "text-slate-700"
                            }`}
                          />
                        ))}
                      </div>

                      {r.title && (
                        <h5 className="text-xs font-bold text-slate-200">{r.title}</h5>
                      )}
                      <p className="text-xs text-slate-400">{r.comment}</p>

                      {r.status === "REJECTED" && r.moderationReason && (
                        <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px]">
                          <strong>Moderation feedback:</strong> {r.moderationReason}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">You haven&apos;t submitted any reviews yet.</p>
              )}
            </div>
          </div>
        ) : bookings.length === 0 ? (
          <EmptyState
            icon={CalendarDays} art="calendar"
            title={`No ${TAB_LABELS[activeTab]}bookings found`}
            description="You don't have any reservations in this filter category."
            actionHref="/facilities"
            actionLabel="Discover Facilities"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onCancel={handleOpenCancelModal}
              />
            ))}
          </div>
        )}
      </div>

      {/* Cancellation Modal */}
      {cancellingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-[var(--surface)] p-6 shadow-2xl relative">
            <button
              onClick={() => {
                if (!cancellingInProgress) {
                  setCancellingBooking(null);
                  setCancellationError(null);
                }
              }}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-4">
              <div className="h-12 w-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <Trash2 className="h-6 w-6" />
              </div>

              <div>
                <h3 className="text-xl font-black text-white">Cancel Reservation?</h3>
                <p className="mt-1 text-xs text-slate-400">
                  Are you sure you want to cancel your booking for{" "}
                  <strong className="text-white">{cancellingBooking.facilityName}</strong> on{" "}
                  <strong className="text-white">{cancellingBooking.bookingDate}</strong> (
                  {cancellingBooking.startTime} - {cancellingBooking.endTime})?
                </p>
              </div>

              {cancellationError && (
                <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{cancellationError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Cancellation Reason (Optional)
                </label>
                <textarea
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="e.g., Schedule conflict, teammate unavailable..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-cyan-400">
                Notice: Cancellations trigger automatic promotion for students in the waiting list queue.
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={cancellingInProgress}
                  onClick={() => setCancellingBooking(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-all"
                >
                  Keep Booking
                </button>
                <button
                  type="button"
                  disabled={cancellingInProgress}
                  onClick={handleConfirmCancel}
                  className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs bg-rose-500 text-white hover:bg-rose-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {cancellingInProgress ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Cancelling...
                    </>
                  ) : (
                    "Confirm Cancel"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Review Submission Modal */}
      {reviewModalBooking && (
        <ReviewModal
          bookingId={reviewModalBooking.id}
          facilityName={reviewModalBooking.facilityName}
          onClose={() => setReviewModalBooking(null)}
          onSuccess={() => setRefreshTrigger((prev) => prev + 1)}
        />
      )}
    </DashboardLayout>
  );
}
