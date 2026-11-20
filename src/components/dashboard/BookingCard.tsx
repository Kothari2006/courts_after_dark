import { Calendar, Clock, MapPin, Zap, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BookingItem {
  id: string;
  facilityName: string;
  sportType: string;
  location?: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  startAt?: string;
  endAt?: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "REJECTED";
  bookingType: "REGULAR" | "PRIME_TIME";
  attendanceStatus?: "PENDING" | "CHECKED_IN" | "NO_SHOW";
  cancellationReason?: string;
  cancelledAt?: string;
  canCancel?: boolean;
}

interface BookingCardProps {
  booking: BookingItem;
  onCancel?: (booking: BookingItem) => void;
}

export default function BookingCard({ booking, onCancel }: BookingCardProps) {
  const getStatusBadge = () => {
    switch (booking.status) {
      case "CONFIRMED":
        return "bg-lime-400/10 text-lime-400 border-lime-400/30";
      case "PENDING":
        return "bg-amber-400/10 text-amber-400 border-amber-400/30";
      case "COMPLETED":
        return "bg-cyan-400/10 text-cyan-400 border-cyan-400/30";
      case "CANCELLED":
      case "REJECTED":
        return "bg-rose-500/10 text-rose-400 border-rose-500/30";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  const cancellable = booking.canCancel ?? (booking.status === "CONFIRMED" || booking.status === "PENDING");

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800/80 bg-[var(--surface)] p-5 shadow-lg transition-all hover:border-slate-700 flex flex-col justify-between">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              {booking.sportType}
            </span>
            {booking.bookingType === "PRIME_TIME" && (
              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <Zap className="h-2.5 w-2.5 fill-amber-400 text-amber-400" /> Prime Time
              </span>
            )}
            {booking.attendanceStatus === "CHECKED_IN" && (
              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Checked In
              </span>
            )}
            {booking.attendanceStatus === "NO_SHOW" && (
              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">
                No-Show
              </span>
            )}
          </div>

          <span
            className={cn(
              "text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border",
              getStatusBadge()
            )}
          >
            {booking.status}
          </span>
        </div>

        <div className="mt-4">
          <h4 className="text-base font-bold text-white">{booking.facilityName}</h4>
          {booking.location && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
              <MapPin className="h-3.5 w-3.5 text-slate-500" />
              <span>{booking.location}</span>
            </p>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-900/60 border border-slate-800/60 p-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Calendar className="h-4 w-4 text-lime-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">Date</span>
              <span className="font-semibold text-slate-200">{booking.bookingDate}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-300">
            <Clock className="h-4 w-4 text-lime-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">Time Slot</span>
              <span className="font-semibold text-slate-200">
                {booking.startTime} - {booking.endTime}
              </span>
            </div>
          </div>
        </div>

        {booking.cancellationReason && (
          <div className="mt-3 p-2.5 rounded-lg bg-rose-500/5 border border-rose-500/20 text-xs text-rose-400">
            <span className="font-semibold">Reason: </span>
            {booking.cancellationReason}
          </div>
        )}
      </div>

      {/* Action Footer for active bookings */}
      {onCancel && (booking.status === "CONFIRMED" || booking.status === "PENDING") && (
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
          {cancellable ? (
            <button
              type="button"
              onClick={() => onCancel(booking)}
              className="w-full py-2 px-3 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            >
              <XCircle className="h-3.5 w-3.5" /> Cancel Reservation
            </button>
          ) : (
            <span className="text-[11px] text-slate-500 italic text-center w-full">
              Non-refundable & non-cancellable (&lt; 2 hrs before start)
            </span>
          )}
        </div>
      )}
    </div>
  );
}
