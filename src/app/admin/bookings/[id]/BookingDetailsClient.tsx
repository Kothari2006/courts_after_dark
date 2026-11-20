"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  User,
  Mail,
  Phone,
  Zap,
  CheckCircle2,
  AlertCircle,
  Ban,
  Check,
  X,
  UserCheck,
  Users,
  ShieldAlert,
} from "lucide-react";

export interface BookingDetailsData {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    phoneNumber?: string;
    role?: string;
    createdAt?: string;
  };
  facility: {
    _id: string;
    name: string;
    sportType: string;
    location: string;
    operatingHours?: { open: string; close: string };
    slotDuration?: number;
    timezone?: string;
    images?: string[];
  };
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

export interface WaitlistItem {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    phoneNumber?: string;
    role?: string;
  };
  position: number;
  status: string;
  createdAt: string;
}

interface BookingDetailsClientProps {
  initialBooking: BookingDetailsData;
  initialWaitlist: WaitlistItem[];
}

export default function BookingDetailsClient({
  initialBooking,
  initialWaitlist,
}: BookingDetailsClientProps) {
  const router = useRouter();
  const [booking, setBooking] = useState<BookingDetailsData>(initialBooking);
  const [waitlist] = useState<WaitlistItem[]>(initialWaitlist);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modals
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const handleStatusUpdate = async (
    targetStatus: "CONFIRMED" | "CANCELLED" | "REJECTED" | "COMPLETED",
    reason?: string
  ) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/admin/bookings/${booking._id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus, reason }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update booking status");
      }

      setBooking(data.booking);
      setSuccess(data.message || `Status updated to ${targetStatus}`);
      setShowCancelModal(false);
      setShowRejectModal(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAttendance = async (attendanceStatus: "CHECKED_IN" | "NO_SHOW") => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/admin/bookings/${booking._id}/attendance`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendanceStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update attendance");
      }

      setBooking((prev) => ({
        ...prev,
        attendanceStatus,
      }));
      setSuccess(`Attendance recorded as ${attendanceStatus}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record attendance");
    } finally {
      setIsSubmitting(false);
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

  const startDate = new Date(booking.startAt);
  const formattedDate = startDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link
          href="/admin/bookings"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Bookings
        </Link>

        {/* Action Buttons Header */}
        <div className="flex items-center gap-2">
          {booking.status === "PENDING" && (
            <>
              <button
                onClick={() => handleStatusUpdate("CONFIRMED")}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-colors shadow-lg shadow-emerald-500/20"
              >
                <Check className="w-3.5 h-3.5" />
                Approve & Confirm
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Reject
              </button>
            </>
          )}

          {booking.status === "CONFIRMED" && (
            <>
              <button
                onClick={() => handleStatusUpdate("COMPLETED")}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Mark Completed
              </button>
              <button
                onClick={() => setShowCancelModal(true)}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
              >
                <Ban className="w-3.5 h-3.5" />
                Cancel Reservation
              </button>
            </>
          )}
        </div>
      </div>

      {/* Alert Banners */}
      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-emerald-400/70 hover:text-emerald-400 text-xs">
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
          <button onClick={() => setError(null)} className="text-rose-400/70 hover:text-rose-400 text-xs">
            ✕
          </button>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Booking & Facility Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Booking Overview Card */}
          <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-800 pb-4">
              <div>
                <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
                  Reservation Record
                </span>
                <h2 className="text-xl font-black text-white font-mono mt-0.5">
                  #{booking._id}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {booking.bookingType === "PRIME_TIME" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Zap className="w-3 h-3 fill-amber-400" />
                    Prime Time
                  </span>
                )}
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadge(
                    booking.status
                  )}`}
                >
                  {booking.status}
                </span>
              </div>
            </div>

            {/* Time and Date Highlight */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
                <Calendar className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Booking Date
                  </p>
                  <p className="text-sm font-bold text-white mt-0.5">{formattedDate}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
                <Clock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Reserved Time Window
                  </p>
                  <p className="text-sm font-bold text-white mt-0.5">
                    {booking.startTime} - {booking.endTime}
                  </p>
                </div>
              </div>
            </div>

            {/* Cancellation Notice if applicable */}
            {booking.status === "CANCELLED" && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-1">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  Cancellation Details
                </div>
                <p className="text-sm text-zinc-200 mt-1">
                  <strong>Reason:</strong> {booking.cancellationReason || "No reason specified"}
                </p>
                {booking.cancelledAt && (
                  <p className="text-[11px] text-zinc-400">
                    Cancelled on {new Date(booking.cancelledAt).toLocaleString("en-US")}
                  </p>
                )}
              </div>
            )}

            {/* Rejection Notice if applicable */}
            {booking.status === "REJECTED" && (
              <div className="p-4 rounded-xl bg-zinc-800/60 border border-zinc-700/60 space-y-1">
                <div className="flex items-center gap-2 text-zinc-300 font-bold text-xs uppercase tracking-wider">
                  <X className="w-4 h-4 shrink-0 text-rose-400" />
                  Rejection Reason
                </div>
                <p className="text-sm text-zinc-200 mt-1">
                  {booking.cancellationReason || "Rejected by administrator"}
                </p>
              </div>
            )}

            {/* Metadata Timestamps */}
            <div className="border-t border-zinc-800 pt-3 text-[11px] text-zinc-500 flex flex-wrap gap-x-6 gap-y-1">
              <span>
                Created: <strong className="text-zinc-400">{new Date(booking.createdAt).toLocaleString("en-US")}</strong>
              </span>
              <span>
                Last Updated: <strong className="text-zinc-400">{new Date(booking.updatedAt).toLocaleString("en-US")}</strong>
              </span>
            </div>
          </div>

          {/* Facility Details Card */}
          <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              Facility Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-zinc-400">Facility Name</p>
                <p className="text-sm font-semibold text-white mt-0.5">
                  {booking.facility?.name}
                </p>
              </div>

              <div>
                <p className="text-zinc-400">Sport Category</p>
                <p className="text-sm font-semibold text-white mt-0.5">
                  {booking.facility?.sportType}
                </p>
              </div>

              <div>
                <p className="text-zinc-400">Campus Location</p>
                <p className="text-sm font-semibold text-white mt-0.5">
                  {booking.facility?.location}
                </p>
              </div>

              <div>
                <p className="text-zinc-400">Operating Hours & Slot</p>
                <p className="text-sm font-semibold text-white mt-0.5">
                  {booking.facility?.operatingHours?.open} - {booking.facility?.operatingHours?.close} ({booking.facility?.slotDuration || 60} min slots)
                </p>
              </div>
            </div>
          </div>

          {/* Attendance Management Card */}
          <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                Attendance Verification
              </h3>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                {booking.attendanceStatus}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleAttendance("CHECKED_IN")}
                disabled={isSubmitting || booking.status !== "CONFIRMED"}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  booking.attendanceStatus === "CHECKED_IN"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-40"
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                Mark Checked In
              </button>

              <button
                onClick={() => handleAttendance("NO_SHOW")}
                disabled={isSubmitting || booking.status !== "CONFIRMED"}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  booking.attendanceStatus === "NO_SHOW"
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                    : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-40"
                }`}
              >
                <Ban className="w-3.5 h-3.5" />
                Mark No-Show
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Student Info & Waitlist Info */}
        <div className="space-y-6">
          {/* Student Profile Card */}
          <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-400" />
              Student Profile
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <p className="text-zinc-500">Name</p>
                <p className="font-semibold text-zinc-200 mt-0.5 text-sm">
                  {booking.user?.name || "Unknown"}
                </p>
              </div>

              <div>
                <p className="text-zinc-500">Email</p>
                <p className="font-mono text-zinc-200 mt-0.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-zinc-500" />
                  {booking.user?.email || "No email"}
                </p>
              </div>

              {booking.user?.phoneNumber && (
                <div>
                  <p className="text-zinc-500">Phone</p>
                  <p className="font-mono text-zinc-200 mt-0.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-zinc-500" />
                    {booking.user?.phoneNumber}
                  </p>
                </div>
              )}

              <div>
                <p className="text-zinc-500">Role</p>
                <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                  {booking.user?.role || "STUDENT"}
                </span>
              </div>
            </div>

            <div className="border-t border-zinc-800 pt-3">
              <Link
                href={`/admin/users/${booking.user?._id}`}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-4"
              >
                View Full User Details →
              </Link>
            </div>
          </div>

          {/* Waitlist Entries for This Court Slot */}
          <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                Slot Waiting List
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {waitlist.length} Waiting
              </span>
            </div>

            {waitlist.length === 0 ? (
              <p className="text-xs text-zinc-500 py-3 text-center">
                No active waitlist entries for this slot.
              </p>
            ) : (
              <div className="space-y-2.5">
                {waitlist.map((w) => (
                  <div
                    key={w._id}
                    className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-zinc-200">{w.user?.name}</div>
                      <div className="text-[11px] text-zinc-500">{w.user?.email}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 font-mono text-[11px] font-bold">
                      #{w.position}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5 text-rose-400 font-bold text-lg">
                <Ban className="w-5 h-5 shrink-0" />
                Cancel Reservation
              </div>
              <button
                onClick={() => setShowCancelModal(false)}
                className="text-zinc-500 hover:text-zinc-300 text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Are you sure you want to cancel this booking? This action cannot be reversed.
            </p>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
              ⚡ <strong>Waitlist Auto-Promotion:</strong> If other students are in the waiting list for this court slot, the next candidate will immediately be promoted to CONFIRMED.
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Cancellation Reason (Required)
              </label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Specify the reason for administrative cancellation..."
                className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-rose-500 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none transition-colors"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-800 rounded-xl transition-colors"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={() => handleStatusUpdate("CANCELLED", cancelReason)}
                disabled={isSubmitting || cancelReason.trim().length < 3}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-lg shadow-rose-600/20"
              >
                {isSubmitting ? "Cancelling..." : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5 text-zinc-200 font-bold text-lg">
                <X className="w-5 h-5 text-rose-400 shrink-0" />
                Reject Pending Reservation
              </div>
              <button
                onClick={() => setShowRejectModal(false)}
                className="text-zinc-500 hover:text-zinc-300 text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Rejecting pending request for {booking.facility?.name}.
            </p>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Rejection Reason (Optional)
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g., Conflict with campus event or maintenance schedule..."
                className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-zinc-500 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none transition-colors"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleStatusUpdate("REJECTED", rejectReason)}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-bold text-white bg-zinc-700 hover:bg-zinc-600 rounded-xl transition-colors"
              >
                {isSubmitting ? "Rejecting..." : "Reject Booking"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

