"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import EmptyState from "@/components/dashboard/EmptyState";
import {
  Dumbbell,
  PackageCheck,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  Loader2,
  Calendar,
  X,
  History,
  AlertCircle,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EquipmentItem {
  _id: string;
  name: string;
  category: string;
  description?: string;
  totalQuantity: number;
  availableQuantity: number;
  damagedQuantity: number;
  status: "AVAILABLE" | "UNAVAILABLE";
}

interface CheckoutItemDetail {
  equipment: {
    _id: string;
    name: string;
    category: string;
  };
  quantity: number;
  returnedQuantity: number;
  damagedQuantity: number;
}

interface CheckoutRecord {
  _id: string;
  booking?: {
    _id: string;
    facility?: {
      _id: string;
      name: string;
      sportType: string;
    };
    startAt: string;
    endAt: string;
    status: string;
  };
  items: CheckoutItemDetail[];
  status: "REQUESTED" | "ISSUED" | "RETURNED" | "OVERDUE" | "REJECTED" | "CANCELLED";
  expectedReturnAt: string;
  issuedAt?: string;
  returnedAt?: string;
  notes?: string;
  isOverdue?: boolean;
  createdAt: string;
}

interface ConfirmedBooking {
  _id: string;
  facility: {
    _id: string;
    name: string;
    sportType: string;
  };
  startAt: string;
  endAt: string;
  status: string;
}

export default function EquipmentPage() {
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "CATALOG" | "HISTORY">("ACTIVE");
  const [catalog, setCatalog] = useState<EquipmentItem[]>([]);
  const [checkouts, setCheckouts] = useState<CheckoutRecord[]>([]);
  const [bookings, setBookings] = useState<ConfirmedBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [selectedEquipmentId, setSelectedEquipmentId] = useState("");
  const [requestQuantity, setRequestQuantity] = useState(1);
  const [expectedReturnAt, setExpectedReturnAt] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const [catRes, myRes, bookingsRes] = await Promise.all([
          fetch("/api/equipment?limit=100"),
          fetch("/api/equipment/my"),
          fetch("/api/bookings/my?filter=UPCOMING&limit=50"),
        ]);

        if (!catRes.ok || !myRes.ok) {
          throw new Error("Failed to load equipment data");
        }

        const catData = await catRes.json();
        const myData = await myRes.json();

        if (isMounted) {
          setCatalog(catData.equipment || []);
          setCheckouts(myData.checkouts || []);

          if (bookingsRes.ok) {
            const bookingsData = await bookingsRes.json();
            const confirmed = (bookingsData.bookings || []).filter(
              (b: ConfirmedBooking) => b.status === "CONFIRMED"
            );
            setBookings(confirmed);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load equipment data");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [refreshTrigger]);

  // When a booking is selected in modal, default the return time to booking's end time
  const handleBookingChange = (bId: string) => {
    setSelectedBookingId(bId);
    const chosen = bookings.find((b) => b._id === bId);
    if (chosen?.endAt) {
      // Format as YYYY-MM-DDTHH:mm for datetime-local input
      const d = new Date(chosen.endAt);
      const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setExpectedReturnAt(localIso);
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingId || !selectedEquipmentId || !expectedReturnAt) {
      setSubmitError("Please fill out all required fields");
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError(null);
      setSubmitSuccess(null);

      const res = await fetch("/api/equipment/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: selectedBookingId,
          items: [
            {
              equipmentId: selectedEquipmentId,
              quantity: Number(requestQuantity),
            },
          ],
          expectedReturnAt: new Date(expectedReturnAt).toISOString(),
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to submit request");
      }

      setSubmitSuccess("Equipment request submitted! Collect at the sports desk.");
      setTimeout(() => {
        setRequestModalOpen(false);
        setSubmitSuccess(null);
        setSelectedBookingId("");
        setSelectedEquipmentId("");
        setRequestQuantity(1);
        setExpectedReturnAt("");
        setNotes("");
        setRefreshTrigger((prev) => prev + 1);
      }, 1200);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Error submitting request");
    } finally {
      setSubmitting(false);
    }
  };

  const activeCheckouts = checkouts.filter(
    (c) => c.status === "REQUESTED" || c.status === "ISSUED" || c.status === "OVERDUE"
  );
  const pastCheckouts = checkouts.filter(
    (c) => c.status === "RETURNED" || c.status === "CANCELLED" || c.status === "REJECTED"
  );

  const selectedEquipItem = catalog.find((i) => i._id === selectedEquipmentId);
  const maxAvailable = selectedEquipItem ? selectedEquipItem.availableQuantity : 1;

  return (
    <DashboardLayout title="Sports Equipment">
      <div className="space-y-8">
        {/* Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-[var(--surface)] p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-lime-400/10 border border-lime-400/20 px-3 py-0.5 text-xs font-bold text-lime-400 mb-2">
                <Dumbbell className="h-3 w-3" /> Campus Sports Equipment Desk
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Equipment Requests & Gear Lending
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-400 leading-relaxed">
                Borrow tournament-grade sports gear during your confirmed court reservations. Request gear in advance and pick it up at the equipment desk.
              </p>
            </div>

            <div>
              <button
                onClick={() => setRequestModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-lime-400 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-lime-300 transition-colors shadow-lg shadow-lime-400/20 whitespace-nowrap cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Request Equipment
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800">
          <button
            onClick={() => setActiveTab("ACTIVE")}
            className={cn(
              "px-5 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2",
              activeTab === "ACTIVE"
                ? "border-lime-400 text-lime-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            )}
          >
            <PackageCheck className="h-4 w-4" />
            Active Requests & Checkouts
            {activeCheckouts.length > 0 && (
              <span className="ml-1 px-2 py-0.5 text-[10px] font-black rounded-full bg-lime-400/20 text-lime-400">
                {activeCheckouts.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("CATALOG")}
            className={cn(
              "px-5 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2",
              activeTab === "CATALOG"
                ? "border-lime-400 text-lime-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            )}
          >
            <Sparkles className="h-4 w-4" />
            Equipment Catalog
          </button>

          <button
            onClick={() => setActiveTab("HISTORY")}
            className={cn(
              "px-5 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2",
              activeTab === "HISTORY"
                ? "border-lime-400 text-lime-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            )}
          >
            <History className="h-4 w-4" />
            Return History
          </button>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin text-lime-400 mb-3" />
            <p className="text-sm">Loading equipment status...</p>
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-400 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        ) : (
          <>
            {/* Active Tab */}
            {activeTab === "ACTIVE" && (
              <div>
                {activeCheckouts.length === 0 ? (
                  <EmptyState
                    icon={PackageCheck} art="gear"
                    title="No equipment currently checked out"
                    description="You have no outstanding equipment. When you reserve a court, request rackets, balls, or nets to pick up before your game."
                    actionHref="/facilities"
                    actionLabel="Reserve a Court"
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {activeCheckouts.map((checkout) => (
                      <div
                        key={checkout._id}
                        className={cn(
                          "rounded-2xl border p-5 transition-all shadow-lg",
                          checkout.status === "OVERDUE" || checkout.isOverdue
                            ? "border-rose-500/40 bg-rose-950/20"
                            : checkout.status === "ISSUED"
                            ? "border-emerald-500/30 bg-[var(--surface)]"
                            : "border-amber-500/30 bg-[var(--surface)]"
                        )}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className={cn(
                                  "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                                  checkout.status === "OVERDUE" || checkout.isOverdue
                                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse"
                                    : checkout.status === "ISSUED"
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                                    : "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                                )}
                              >
                                {checkout.status === "OVERDUE" || checkout.isOverdue
                                  ? "OVERDUE RETURN"
                                  : checkout.status === "ISSUED"
                                  ? "ISSUED • WITH STUDENT"
                                  : "REQUESTED • DESK PENDING"}
                              </span>
                            </div>
                            <h4 className="text-lg font-bold text-white">
                              {checkout.items.map((i) => `${i.quantity}x ${i.equipment?.name || "Item"}`).join(", ")}
                            </h4>
                          </div>

                          <div className="text-right">
                            <span className="text-xs text-slate-400">Return By</span>
                            <p className={cn(
                              "text-xs font-bold",
                              checkout.status === "OVERDUE" || checkout.isOverdue ? "text-rose-400" : "text-white"
                            )}>
                              {new Date(checkout.expectedReturnAt).toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>

                        {/* Booking Context */}
                        {checkout.booking && (
                          <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-3 mb-4 space-y-1 text-xs">
                            <div className="flex items-center gap-2 text-slate-300">
                              <Calendar className="h-3.5 w-3.5 text-lime-400 shrink-0" />
                              <span>
                                {checkout.booking.facility?.name || "Sports Court"} (
                                {checkout.booking.facility?.sportType || "Facility"})
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-400">
                              <Clock className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                              <span>
                                {new Date(checkout.booking.startAt).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}{" "}
                                •{" "}
                                {new Date(checkout.booking.startAt).toLocaleTimeString("en-US", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                                {" - "}
                                {new Date(checkout.booking.endAt).toLocaleTimeString("en-US", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Overdue Alert */}
                        {(checkout.status === "OVERDUE" || checkout.isOverdue) && (
                          <div className="flex items-center gap-2 text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl mb-3">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <span>
                              This equipment is past due. Please return it to the desk immediately to avoid checkout restrictions.
                            </span>
                          </div>
                        )}

                        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                          <span>Ref: {checkout._id.slice(-6)}</span>
                          <span>
                            {checkout.status === "REQUESTED"
                              ? "Awaiting desk verification"
                              : "Issued by equipment desk"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Catalog Tab */}
            {activeTab === "CATALOG" && (
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {catalog.map((item) => (
                    <div
                      key={item._id}
                      className="rounded-2xl border border-slate-800 bg-[var(--surface)] p-5 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-bold text-white text-base">{item.name}</span>
                        <span
                          className={cn(
                            "text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border",
                            item.availableQuantity > 0
                              ? "bg-lime-400/10 border-lime-400/20 text-lime-400"
                              : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                          )}
                        >
                          {item.availableQuantity > 0
                            ? `${item.availableQuantity} Available`
                            : "Out of Stock"}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed mb-4 min-h-[32px]">
                        {item.description || `High-quality ${item.category.toLowerCase()} equipment.`}
                      </p>

                      <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1 text-slate-400">
                          Category: <strong className="text-slate-300">{item.category}</strong>
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Total stock: {item.totalQuantity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* History Tab */}
            {activeTab === "HISTORY" && (
              <div>
                {pastCheckouts.length === 0 ? (
                  <EmptyState
                    icon={History} art="list"
                    title="No return history yet"
                    description="Records of completed and returned equipment will appear here after you finish your game sessions."
                  />
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[var(--surface)]">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-900/60 uppercase tracking-wider text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="px-5 py-3.5">Ref</th>
                          <th className="px-5 py-3.5">Equipment</th>
                          <th className="px-5 py-3.5">Booking</th>
                          <th className="px-5 py-3.5">Status</th>
                          <th className="px-5 py-3.5">Returned At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {pastCheckouts.map((rec) => (
                          <tr key={rec._id} className="hover:bg-slate-900/30">
                            <td className="px-5 py-4 font-mono text-slate-400">{rec._id.slice(-6)}</td>
                            <td className="px-5 py-4 font-bold text-white">
                              {rec.items.map((i) => `${i.quantity}x ${i.equipment?.name || "Item"}`).join(", ")}
                            </td>
                            <td className="px-5 py-4">
                              {rec.booking?.facility?.name || "Court Session"}
                            </td>
                            <td className="px-5 py-4">
                              <span
                                className={cn(
                                  "px-2 py-0.5 rounded-full text-[10px] font-bold",
                                  rec.status === "RETURNED"
                                    ? "bg-slate-800 text-slate-300"
                                    : "bg-rose-500/10 text-rose-400"
                                )}
                              >
                                {rec.status}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-slate-400">
                              {rec.returnedAt
                                ? new Date(rec.returnedAt).toLocaleString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Request Equipment Modal */}
        {requestModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-[var(--surface)] p-6 sm:p-8 shadow-2xl relative">
              <button
                onClick={() => setRequestModalOpen(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2 mb-2 text-lime-400 text-xs font-bold uppercase tracking-wider">
                <Dumbbell className="h-4 w-4" /> Equipment Desk Request
              </div>
              <h3 className="text-xl font-black text-white">Reserve Sports Equipment</h3>
              <p className="text-xs text-slate-400 mt-1 mb-6">
                Equipment can only be requested against an active confirmed court booking.
              </p>

              {bookings.length === 0 ? (
                <div className="p-5 rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-300 text-xs space-y-2 mb-6">
                  <div className="flex items-center gap-2 font-bold">
                    <ShieldAlert className="h-4 w-4 shrink-0" />
                    <span>No Confirmed Court Bookings Found</span>
                  </div>
                  <p className="text-slate-400">
                    Equipment can only be requested for an upcoming (or ongoing) confirmed court booking. Past or cancelled bookings do not count. Please reserve a court slot first.
                  </p>
                  <Link
                    href="/facilities"
                    className="inline-block mt-1 rounded-lg bg-lime-400 px-3 py-1.5 text-[11px] font-bold text-slate-950 hover:bg-lime-300"
                  >
                    Book a Court
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmitRequest} className="space-y-4">
                  {/* Select Booking */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Target Court Booking <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={selectedBookingId}
                      onChange={(e) => handleBookingChange(e.target.value)}
                      required
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-lime-400"
                    >
                      <option value="">Select your court booking...</option>
                      {bookings.map((b) => (
                        <option key={b._id} value={b._id}>
                          {b.facility?.name} ({b.facility?.sportType}) -{" "}
                          {new Date(b.startAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          ({new Date(b.startAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Select Equipment Item */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Equipment Item <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={selectedEquipmentId}
                      onChange={(e) => {
                        setSelectedEquipmentId(e.target.value);
                        setRequestQuantity(1);
                      }}
                      required
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-lime-400"
                    >
                      <option value="">
                        {catalog.some((i) => i.status === "AVAILABLE" && i.availableQuantity > 0)
                          ? "Select equipment from catalog..."
                          : "No equipment currently available"}
                      </option>
                      {catalog
                        .filter((item) => item.status === "AVAILABLE" && item.availableQuantity > 0)
                        .map((item) => (
                          <option key={item._id} value={item._id}>
                            {item.name} ({item.category}) — {item.availableQuantity} available
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Quantity & Expected Return */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Quantity <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={maxAvailable > 0 ? maxAvailable : 1}
                        value={requestQuantity}
                        onChange={(e) =>
                          setRequestQuantity(
                            Math.min(maxAvailable > 0 ? maxAvailable : 1, Math.max(1, parseInt(e.target.value) || 1))
                          )
                        }
                        required
                        className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-lime-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Expected Return Time <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={expectedReturnAt}
                        onChange={(e) => setExpectedReturnAt(e.target.value)}
                        required
                        className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-lime-400"
                      />
                    </div>
                  </div>

                  {/* Optional Notes */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Notes / Specifications (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Size 7 basketball, extra grip tape"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-lime-400"
                    />
                  </div>

                  {submitError && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  {submitSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>{submitSuccess}</span>
                    </div>
                  )}

                  <div className="pt-4 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setRequestModalOpen(false)}
                      className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="rounded-xl bg-lime-400 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-lime-300 disabled:opacity-50 transition-colors flex items-center gap-2 cursor-pointer shadow-md shadow-lime-400/20"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                        </>
                      ) : (
                        "Submit Request"
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
