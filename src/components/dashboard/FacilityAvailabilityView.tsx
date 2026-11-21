"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  Lock,
  AlertTriangle,
  Ban,
  RefreshCw,
  Info,
  X,
  Loader2,
  Check,
  ShieldCheck,
  ArrowRight,
  Zap,
  ListOrdered,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SlotItem {
  startAt: string;
  endAt: string;
  startTime: string;
  endTime: string;
  status: "AVAILABLE" | "BOOKED" | "MAINTENANCE" | "UNAVAILABLE";
  reason?: string;
}

interface AvailabilityData {
  success: boolean;
  facilityId: string;
  facilityName: string;
  sportType: string;
  date: string;
  timezone: string;
  operatingHours: { open: string; close: string };
  slotDuration: number;
  totalSlots: number;
  availableSlotsCount: number;
  slots: SlotItem[];
}

interface FacilityAvailabilityViewProps {
  facilityId: string;
  isDemo?: boolean;
  demoName?: string;
  demoSportType?: string;
  demoLocation?: string;
  demoOperatingHours?: { open: string; close: string };
  demoSlotDuration?: number;
}

export default function FacilityAvailabilityView({
  facilityId,
  isDemo = false,
  demoName,
  demoSportType,
  demoLocation,
  demoOperatingHours,
  demoSlotDuration = 60,
}: FacilityAvailabilityViewProps) {
  const getTodayStr = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());
  const [data, setData] = useState<AvailabilityData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Booking Modal State
  const [bookingSlot, setBookingSlot] = useState<SlotItem | null>(null);
  const [submittingBooking, setSubmittingBooking] = useState<boolean>(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<boolean>(false);

  // Waitlist Modal State
  const [waitlistSlot, setWaitlistSlot] = useState<SlotItem | null>(null);
  const [submittingWaitlist, setSubmittingWaitlist] = useState<boolean>(false);
  const [waitlistError, setWaitlistError] = useState<string | null>(null);
  const [waitlistSuccess, setWaitlistSuccess] = useState<boolean>(false);
  const [waitlistPosition, setWaitlistPosition] = useState<number | null>(null);
  const [demoReservedSlots, setDemoReservedSlots] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isDemo) return;

    const timer = window.setTimeout(() => {
      try {
        const storedSlots = window.localStorage.getItem(`demo-facility-bookings:${facilityId}`);
        setDemoReservedSlots(
          storedSlots ? new Set(JSON.parse(storedSlots) as string[]) : new Set()
        );
      } catch {
        setDemoReservedSlots(new Set());
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [facilityId, isDemo]);

  useEffect(() => {
    let isMounted = true;

    async function loadAvailability() {
      setLoading(true);
      setError(null);
      try {
        if (isDemo) {
          const openTime = demoOperatingHours?.open || "06:00";
          const closeTime = demoOperatingHours?.close || "23:00";
          const toMinutes = (time: string) => {
            const [hours, minutes] = time.split(":").map(Number);
            return hours * 60 + minutes;
          };
          const toTime = (minutes: number) => {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
          };
          const slots: SlotItem[] = [];

          for (
            let start = toMinutes(openTime);
            start + demoSlotDuration <= toMinutes(closeTime);
            start += demoSlotDuration
          ) {
            const startTime = toTime(start);
            const endTime = toTime(start + demoSlotDuration);
            const startDate = new Date(`${selectedDate}T${startTime}:00`);
            let status: SlotItem["status"] =
              startDate.getTime() <= Date.now() ? "UNAVAILABLE" : "AVAILABLE";

            if (
              status === "AVAILABLE" &&
              demoReservedSlots.has(`${selectedDate}|${startTime}`)
            ) {
              status = "BOOKED";
            }

            slots.push({
              startAt: startDate.toISOString(),
              endAt: new Date(`${selectedDate}T${endTime}:00`).toISOString(),
              startTime,
              endTime,
              status,
            });
          }

          if (isMounted) {
            setData({
              success: true,
              facilityId,
              facilityName: demoName || "Demo Facility",
              sportType: demoSportType || "SPORTS",
              date: selectedDate,
              timezone: "Asia/Kolkata",
              operatingHours: demoOperatingHours || { open: openTime, close: closeTime },
              slotDuration: demoSlotDuration,
              totalSlots: slots.length,
              availableSlotsCount: slots.filter((slot) => slot.status === "AVAILABLE").length,
              slots,
            });
            setLoading(false);
          }
          return;
        }

        const res = await fetch(`/api/facilities/${facilityId}/availability?date=${selectedDate}`);
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.message || "Failed to load availability for this date");
        }

        if (isMounted) {
          setData(json);
        }
      } catch (err) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : "Error loading availability";
          setError(msg);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadAvailability();

    return () => {
      isMounted = false;
    };
  }, [
    facilityId,
    selectedDate,
    refreshTrigger,
    isDemo,
    demoName,
    demoSportType,
    demoOperatingHours,
    demoSlotDuration,
    demoReservedSlots,
  ]);

  const handleRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const isPrimeTimeSlot = (startTime: string) => {
    return startTime >= "18:00" && startTime < "21:00";
  };

  const handleSelectSlot = (slot: SlotItem) => {
    if (slot.status === "AVAILABLE") {
      setBookingSlot(slot);
      setBookingError(null);
      setBookingSuccess(false);
    } else if (slot.status === "BOOKED") {
      setWaitlistSlot(slot);
      setWaitlistError(null);
      setWaitlistSuccess(false);
      setWaitlistPosition(null);
    }
  };

  const handleConfirmBooking = async () => {
    if (!bookingSlot) return;

    setSubmittingBooking(true);
    setBookingError(null);

    try {
      if (isDemo) {
        setBookingSuccess(true);
        const demoBooking = {
          id: `demo-${facilityId}-${selectedDate}-${bookingSlot.startTime}`,
          facilityId,
          facilityName: demoName || "Demo Facility",
          sportType: demoSportType || "SPORTS",
          location: demoLocation || "",
          bookingDate: selectedDate,
          startTime: bookingSlot.startTime,
          endTime: bookingSlot.endTime,
          startAt: bookingSlot.startAt,
          endAt: bookingSlot.endAt,
          status: "CONFIRMED",
          bookingType:
            bookingSlot.startTime >= "18:00" && bookingSlot.startTime < "21:00"
              ? "PRIME_TIME"
              : "REGULAR",
        };
        setDemoReservedSlots((previous) => {
          const updated = new Set(previous);
          updated.add(`${selectedDate}|${bookingSlot.startTime}`);
          try {
            window.localStorage.setItem(
              `demo-facility-bookings:${facilityId}`,
              JSON.stringify(Array.from(updated))
            );
            const bookingsKey = "demo-facility-my-bookings";
            const existing = JSON.parse(
              window.localStorage.getItem(bookingsKey) || "[]"
            ) as Array<typeof demoBooking>;
            const nextBookings = [
              ...existing.filter((booking) => booking.id !== demoBooking.id),
              demoBooking,
            ];
            window.localStorage.setItem(bookingsKey, JSON.stringify(nextBookings));
          } catch {
            // The in-memory demo state still works if browser storage is unavailable.
          }
          return updated;
        });
        handleRefresh();
        return;
      }

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          facilityId,
          startAt: bookingSlot.startAt,
          endAt: bookingSlot.endAt,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "Failed to confirm court booking");
      }

      setBookingSuccess(true);
      handleRefresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred";
      setBookingError(msg);
    } finally {
      setSubmittingBooking(false);
    }
  };

  const handleJoinWaitlist = async () => {
    if (!waitlistSlot) return;

    setSubmittingWaitlist(true);
    setWaitlistError(null);

    try {
      if (isDemo) {
        const demoWaitlistEntry = {
          id: `demo-waitlist-${facilityId}-${selectedDate}-${waitlistSlot.startTime}`,
          facilityId,
          facilityName: demoName || "Demo Facility",
          sportType: demoSportType || "SPORTS",
          location: demoLocation || "",
          requestedDate: selectedDate,
          startAt: waitlistSlot.startAt,
          endAt: waitlistSlot.endAt,
          position: 1,
          status: "WAITING",
          createdAt: new Date().toISOString(),
        };
        const waitlistKey = "demo-facility-my-waitlists";
        const existing = JSON.parse(
          window.localStorage.getItem(waitlistKey) || "[]"
        ) as Array<typeof demoWaitlistEntry>;
        window.localStorage.setItem(
          waitlistKey,
          JSON.stringify([
            ...existing.filter((entry) => entry.id !== demoWaitlistEntry.id),
            demoWaitlistEntry,
          ])
        );
        setWaitlistSuccess(true);
        setWaitlistPosition(1);
        return;
      }

      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          facilityId,
          startAt: waitlistSlot.startAt,
          endAt: waitlistSlot.endAt,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "Failed to join waiting list");
      }

      setWaitlistSuccess(true);
      setWaitlistPosition(json.waitlistEntry?.position || 1);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An error occurred while joining the queue";
      setWaitlistError(msg);
    } finally {
      setSubmittingWaitlist(false);
    }
  };

  const getQuickDates = () => {
    const list: Array<{ label: string; dateStr: string }> = [];
    const now = new Date();

    for (let i = 0; i < 5; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const dateStr = `${y}-${m}-${day}`;

      let label = `${d.toLocaleDateString("en-US", { weekday: "short" })}, ${d.getDate()} ${d.toLocaleDateString("en-US", { month: "short" })}`;
      if (i === 0) label = "Today";
      if (i === 1) label = "Tomorrow";

      list.push({ label, dateStr });
    }

    return list;
  };

  const quickDates = getQuickDates();

  const getSlotStyle = (status: SlotItem["status"], startTime: string) => {
    const prime = isPrimeTimeSlot(startTime);

    switch (status) {
      case "AVAILABLE":
        return {
          card: prime
            ? "border-amber-400/50 bg-amber-400/5 hover:border-amber-400 hover:bg-amber-400/10 hover:shadow-lg hover:shadow-amber-400/10 text-white cursor-pointer transition-all active:scale-[0.98]"
            : "border-lime-400/40 bg-lime-400/5 hover:border-lime-400 hover:bg-lime-400/10 hover:shadow-lg hover:shadow-lime-400/10 text-white cursor-pointer transition-all active:scale-[0.98]",
          badge: prime
            ? "bg-amber-400/10 text-amber-400 border-amber-400/30"
            : "bg-lime-400/10 text-lime-400 border-lime-400/30",
          icon: CheckCircle2,
          text: "Available",
        };
      case "BOOKED":
        return {
          card: "border-slate-800 bg-slate-900/60 hover:border-cyan-500/40 hover:bg-cyan-500/5 text-slate-300 cursor-pointer transition-all",
          badge: "bg-slate-800 text-slate-400 border-slate-700",
          icon: Lock,
          text: "Booked (Waitlist)",
        };
      case "MAINTENANCE":
        return {
          card: "border-amber-500/40 bg-amber-500/5 text-amber-200 cursor-not-allowed",
          badge: "bg-amber-500/10 text-amber-400 border-amber-500/30",
          icon: AlertTriangle,
          text: "Maintenance",
        };
      default: // UNAVAILABLE / PAST
        return {
          card: "border-slate-800/60 bg-slate-950/60 text-slate-500 opacity-60 cursor-not-allowed",
          badge: "bg-slate-900 text-slate-500 border-slate-800",
          icon: Ban,
          text: "Passed",
        };
    }
  };

  return (
    <div className="rounded-3xl border border-slate-800 bg-[var(--surface)] p-6 sm:p-8 shadow-xl space-y-6">
      {/* Header and Date Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-lime-400 mb-1">
            <Clock className="h-4 w-4" /> Live Schedule & Availability
          </div>
          <h3 className="text-xl font-black text-white">Daily Court Slots</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Click an available slot to book, or click a booked slot to join the automated waiting list queue.
          </p>
        </div>

        {/* Date Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              min={getTodayStr()}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs sm:text-sm text-white focus:outline-none focus:border-lime-400 transition-colors"
            />
          </div>

          <button
            onClick={handleRefresh}
            disabled={loading}
            title="Refresh availability"
            className="p-2 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin text-lime-400")} />
          </button>
        </div>
      </div>

      {/* Quick Date Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {quickDates.map((item) => {
          const isSelected = selectedDate === item.dateStr;
          return (
            <button
              key={item.dateStr}
              onClick={() => setSelectedDate(item.dateStr)}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border",
                isSelected
                  ? "bg-lime-400 text-slate-950 border-lime-400 shadow-md shadow-lime-400/10"
                  : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
              )}
            >
              <CalendarIcon className="h-3 w-3 inline mr-1.5 -mt-0.5" />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Legend & Quota Overview */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="h-2.5 w-2.5 rounded-full bg-lime-400" />
            <span className="font-semibold text-lime-400">Available</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-400">
            <Zap className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span className="font-semibold">Prime Time (6-9 PM)</span>
          </div>
          <div className="flex items-center gap-1.5 text-cyan-400">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
            <span>Booked (Click to Waitlist)</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-800" />
            <span>Passed</span>
          </div>
        </div>

        {data && !loading && (
          <div className="text-[11px] font-semibold text-slate-400">
            <strong className="text-lime-400 font-bold">{data.availableSlotsCount}</strong> of {data.totalSlots} slots available
          </div>
        )}
      </div>

      {/* Slots Grid */}
      {error ? (
        <div className="p-8 text-center rounded-2xl border border-rose-500/20 bg-rose-500/5">
          <p className="text-xs sm:text-sm font-bold text-rose-400 mb-1">
            Failed to calculate availability
          </p>
          <p className="text-xs text-slate-400">{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-3 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-white"
          >
            Retry
          </button>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="h-24 rounded-2xl border border-slate-800 bg-slate-900/60 animate-pulse p-4 space-y-2"
            >
              <div className="h-4 bg-slate-800 rounded w-1/2" />
              <div className="h-3 bg-slate-800/60 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : data?.slots.length === 0 ? (
        <div className="p-8 text-center rounded-2xl border border-dashed border-slate-800 text-slate-400 text-xs">
          No slots generated for this date.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {data?.slots.map((slot, index) => {
            const config = getSlotStyle(slot.status, slot.startTime);
            const Icon = config.icon;
            const isClickable = slot.status === "AVAILABLE" || slot.status === "BOOKED";
            const isPrime = isPrimeTimeSlot(slot.startTime);

            return (
              <button
                key={index}
                type="button"
                disabled={!isClickable}
                onClick={() => handleSelectSlot(slot)}
                className={cn(
                  "p-4 rounded-2xl border flex flex-col justify-between select-none text-left w-full relative overflow-hidden",
                  config.card
                )}
              >
                {isPrime && (
                  <div className="absolute top-2 right-2 text-[9px] font-black uppercase tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/30 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                    <Zap className="h-2 w-2 fill-amber-400" /> Prime
                  </div>
                )}

                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="font-mono text-sm font-extrabold text-white">
                    {slot.startTime} - {slot.endTime}
                  </span>
                  {!isPrime && <Icon className="h-4 w-4 shrink-0" />}
                </div>

                <div className="flex items-center justify-between text-[10px]">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border",
                      config.badge
                    )}
                  >
                    {config.text}
                  </span>
                  <span className="text-slate-400 font-semibold">
                    {data.slotDuration}m
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Booking Confirmation Modal */}
      {bookingSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-[var(--surface)] p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => {
                if (!submittingBooking) {
                  setBookingSlot(null);
                  setBookingSuccess(false);
                  setBookingError(null);
                }
              }}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {bookingSuccess ? (
              <div className="text-center py-4 space-y-4">
                <div className="h-16 w-16 mx-auto rounded-full bg-lime-400/10 border border-lime-400/30 flex items-center justify-center text-lime-400">
                  <Check className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white">Court Confirmed!</h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Your court reservation has been atomically confirmed and added to your schedule.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Link
                    href="/bookings"
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-xs bg-lime-400 text-slate-950 hover:bg-lime-300 transition-all text-center flex items-center justify-center gap-1.5"
                  >
                    View My Bookings <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <button
                    onClick={() => {
                      setBookingSlot(null);
                      setBookingSuccess(false);
                    }}
                    className="py-3 px-4 rounded-xl font-bold text-xs bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-lime-400/10 border border-lime-400/20 px-3 py-0.5 text-xs font-bold text-lime-400 mb-2">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Confirm Court Reservation
                  </div>
                  <h3 className="text-2xl font-black text-white">{data?.facilityName}</h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Review reservation details and fair-play limits before booking.
                  </p>
                </div>

                {bookingError && (
                  <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs flex items-start gap-2.5">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
                    <div className="leading-relaxed font-semibold">{bookingError}</div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-bold">Date</span>
                    <span className="text-sm font-bold text-white">{selectedDate}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-bold">Time Window</span>
                    <span className="text-sm font-bold text-lime-400">
                      {bookingSlot.startTime} - {bookingSlot.endTime}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-bold">Duration</span>
                    <span className="text-sm font-bold text-white">{data?.slotDuration} Minutes</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-bold">Sport Type</span>
                    <span className="text-sm font-bold text-white">{data?.sportType}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900/50 border border-slate-800/80 text-[11px] text-slate-400 space-y-1.5">
                  <div className="flex items-center gap-2 text-slate-300 font-bold">
                    <ShieldCheck className="h-4 w-4 text-lime-400" />
                    <span>Fair-Play Rules:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-400 pl-1">
                    <li>Max 2 active reservations simultaneously per student.</li>
                    <li>Max 1 prime-time reservation (6 PM - 9 PM) per student per day.</li>
                    <li>Free cancellation up to 2 hours before start time.</li>
                  </ul>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    disabled={submittingBooking}
                    onClick={() => setBookingSlot(null)}
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-xs bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={submittingBooking}
                    onClick={handleConfirmBooking}
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-xs bg-lime-400 text-slate-950 hover:bg-lime-300 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submittingBooking ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Confirming...
                      </>
                    ) : (
                      "Confirm Booking"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Join Waiting List Modal */}
      {waitlistSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-[var(--surface)] p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => {
                if (!submittingWaitlist) {
                  setWaitlistSlot(null);
                  setWaitlistSuccess(false);
                  setWaitlistError(null);
                }
              }}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {waitlistSuccess ? (
              <div className="text-center py-4 space-y-4">
                <div className="h-16 w-16 mx-auto rounded-full bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
                  <ListOrdered className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white">Joined Waiting List!</h3>
                  <p className="mt-1 text-xs text-slate-400">
                    You have secured queue position <strong className="text-cyan-400">#{waitlistPosition}</strong> for this court slot.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-left text-xs space-y-1.5 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Court:</span>
                    <span className="font-bold text-white">{data?.facilityName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Date:</span>
                    <span className="font-bold text-white">{selectedDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Slot:</span>
                    <span className="font-bold text-cyan-400">
                      {waitlistSlot.startTime} - {waitlistSlot.endTime}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Auto-Promotion:</span>
                    <span className="font-bold text-lime-400">Active (FIFO Order)</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Link
                    href="/bookings?tab=WAITLIST"
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-xs bg-cyan-400 text-slate-950 hover:bg-cyan-300 transition-all text-center flex items-center justify-center gap-1.5"
                  >
                    View My Waitlists <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <button
                    onClick={() => {
                      setWaitlistSlot(null);
                      setWaitlistSuccess(false);
                    }}
                    className="py-3 px-4 rounded-xl font-bold text-xs bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-cyan-400/10 border border-cyan-400/20 px-3 py-0.5 text-xs font-bold text-cyan-400 mb-2">
                    <ListOrdered className="h-3.5 w-3.5" /> Fair Queue Waiting List
                  </div>
                  <h3 className="text-2xl font-black text-white">Join Queue for Court</h3>
                  <p className="mt-1 text-xs text-slate-400">
                    This slot is currently reserved. Join the automated waiting list to be promoted if the reservation is cancelled.
                  </p>
                </div>

                {waitlistError && (
                  <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs flex items-start gap-2.5">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
                    <div className="leading-relaxed font-semibold">{waitlistError}</div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-bold">Facility</span>
                    <span className="text-sm font-bold text-white">{data?.facilityName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-bold">Time Window</span>
                    <span className="text-sm font-bold text-cyan-400">
                      {waitlistSlot.startTime} - {waitlistSlot.endTime}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900/50 border border-slate-800/80 text-[11px] text-slate-400 space-y-1.5">
                  <div className="flex items-center gap-2 text-slate-300 font-bold">
                    <ShieldCheck className="h-4 w-4 text-cyan-400" />
                    <span>How Auto-Promotion Works:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-400 pl-1">
                    <li>Positions are assigned strictly on a First-In, First-Out (FIFO) basis.</li>
                    <li>If the current reservation is cancelled, the system automatically checks your eligibility.</li>
                    <li>If you satisfy booking limits, the slot is immediately confirmed in your name.</li>
                  </ul>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    disabled={submittingWaitlist}
                    onClick={() => setWaitlistSlot(null)}
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-xs bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-all"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={submittingWaitlist}
                    onClick={handleJoinWaitlist}
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-xs bg-cyan-400 text-slate-950 hover:bg-cyan-300 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submittingWaitlist ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Joining Queue...
                      </>
                    ) : (
                      "Join Waiting List"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Information Banner */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-start gap-3">
        <Info className="h-4 w-4 text-lime-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-slate-200">Phase 9 Fair Allocation:</strong> Prime-time slots (6 PM – 9 PM) are limited to 1 reservation per student per day. Automatic waiting list promotion runs continuously upon cancellation.
        </div>
      </div>
    </div>
  );
}
