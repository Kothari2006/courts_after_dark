"use client";

import { useEffect, useState, use } from "react";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import {
  RotateCcw,
  Clock,
  AlertTriangle,
  Inbox,
  CheckCircle2,
  X,
  Loader2,
  ArrowLeft,
  User as UserIcon,
  Check,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckoutItem {
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
  user: {
    _id: string;
    name?: string;
    email: string;
  };
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
  items: CheckoutItem[];
  status: "REQUESTED" | "ISSUED" | "RETURNED" | "OVERDUE" | "REJECTED" | "CANCELLED";
  expectedReturnAt: string;
  issuedAt?: string;
  returnedAt?: string;
  notes?: string;
  isOverdue?: boolean;
  createdAt: string;
}

export default function EquipmentManagerCheckoutsPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const unwrappedParams = searchParams ? use(searchParams) : undefined;
  const tabParam = unwrappedParams?.tab;
  const initialTab: "REQUESTED" | "ISSUED" | "OVERDUE" | "RETURNED" =
    tabParam === "ISSUED" || tabParam === "OVERDUE" || tabParam === "RETURNED"
      ? tabParam
      : "REQUESTED";

  const [activeTab, setActiveTab] = useState<
    "REQUESTED" | "ISSUED" | "OVERDUE" | "RETURNED"
  >(initialTab);

  const [checkouts, setCheckouts] = useState<CheckoutRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Issue Action State
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Return Modal State
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returningCheckout, setReturningCheckout] = useState<CheckoutRecord | null>(null);
  const [damagedCounts, setDamagedCounts] = useState<{ [equipId: string]: number }>({});
  const [returnNotes, setReturnNotes] = useState("");
  const [returnSubmitting, setReturnSubmitting] = useState(false);
  const [returnError, setReturnError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchCheckouts() {
      try {
        setLoading(true);
        setError(null);

        let url = "/api/equipment/checkouts?limit=100";
        if (activeTab === "OVERDUE") {
          url = "/api/equipment/overdue";
        } else {
          url += `&status=${activeTab}`;
        }

        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to load records");
        const data = await res.json();
        if (isMounted) {
          setCheckouts(data.checkouts || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Error fetching checkout records");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchCheckouts();

    return () => {
      isMounted = false;
    };
  }, [activeTab, refreshTrigger]);

  const handleIssueEquipment = async (id: string) => {
    try {
      setActionLoadingId(id);
      setActionMessage(null);

      const res = await fetch(`/api/equipment/checkouts/${id}/issue`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to issue equipment");
      }

      setActionMessage({
        type: "success",
        text: "Equipment successfully issued and inventory updated!",
      });
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      setActionMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Error issuing equipment",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const openReturnModal = (checkout: CheckoutRecord) => {
    setReturningCheckout(checkout);
    const initialDamaged: { [equipId: string]: number } = {};
    checkout.items.forEach((item) => {
      if (item.equipment?._id) {
        initialDamaged[item.equipment._id] = 0;
      }
    });
    setDamagedCounts(initialDamaged);
    setReturnNotes("");
    setReturnError(null);
    setReturnModalOpen(true);
  };

  const handleProcessReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returningCheckout) return;

    try {
      setReturnSubmitting(true);
      setReturnError(null);

      const damagedItemsPayload = Object.entries(damagedCounts)
        .map(([equipmentId, damagedQuantity]) => ({
          equipmentId,
          damagedQuantity: Number(damagedQuantity) || 0,
        }))
        .filter((d) => d.damagedQuantity > 0);

      const res = await fetch(`/api/equipment/checkouts/${returningCheckout._id}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          damagedItems: damagedItemsPayload,
          notes: returnNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to process return");
      }

      setReturnModalOpen(false);
      setReturningCheckout(null);
      setActionMessage({
        type: "success",
        text: "Equipment return processed successfully!",
      });
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      setReturnError(err instanceof Error ? err.message : "Error processing return");
    } finally {
      setReturnSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb Header */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/equipment-manager/dashboard"
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-cyan-400 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Desk Control Panel
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-black text-white tracking-tight">
            Checkouts & Returns Desk
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Verify student court bookings, hand out requested gear, and audit returned equipment condition.
          </p>
        </div>

        {/* Global Action Banner */}
        {actionMessage && (
          <div
            className={cn(
              "mb-6 p-4 rounded-2xl flex items-center justify-between text-xs font-semibold",
              actionMessage.type === "success"
                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                : "bg-rose-500/10 border border-rose-500/20 text-rose-400"
            )}
          >
            <div className="flex items-center gap-2">
              {actionMessage.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              <span>{actionMessage.text}</span>
            </div>
            <button
              onClick={() => setActionMessage(null)}
              className="text-zinc-500 hover:text-zinc-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Tab Selection */}
        <div className="flex border-b border-zinc-800 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab("REQUESTED")}
            className={cn(
              "px-5 py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap",
              activeTab === "REQUESTED"
                ? "border-cyan-400 text-cyan-400"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            )}
          >
            <Inbox className="h-4 w-4" />
            Pending Requests
          </button>

          <button
            onClick={() => setActiveTab("ISSUED")}
            className={cn(
              "px-5 py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap",
              activeTab === "ISSUED"
                ? "border-cyan-400 text-cyan-400"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            )}
          >
            <Clock className="h-4 w-4" />
            Active Checkouts (Issued)
          </button>

          <button
            onClick={() => setActiveTab("OVERDUE")}
            className={cn(
              "px-5 py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap",
              activeTab === "OVERDUE"
                ? "border-rose-400 text-rose-400"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            )}
          >
            <AlertTriangle className="h-4 w-4" />
            Overdue Returns
          </button>

          <button
            onClick={() => setActiveTab("RETURNED")}
            className={cn(
              "px-5 py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap",
              activeTab === "RETURNED"
                ? "border-cyan-400 text-cyan-400"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            )}
          >
            <RotateCcw className="h-4 w-4" />
            Completed / History
          </button>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16 text-zinc-500">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-400 mb-3" />
            <p className="text-sm">Loading checkout records...</p>
          </div>
        ) : error ? (
          <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : checkouts.length === 0 ? (
          <div className="p-16 border border-dashed border-zinc-800 rounded-3xl text-center text-zinc-500">
            <Inbox className="h-10 w-10 mx-auto mb-3 opacity-40 text-cyan-400" />
            <p className="text-sm font-semibold text-zinc-300">
              No records under {activeTab.toLowerCase()}
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              {activeTab === "REQUESTED"
                ? "No pending student equipment requests at this time."
                : activeTab === "OVERDUE"
                ? "Awesome! No equipment checkouts are currently overdue."
                : "No matching records found in this view."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/40 shadow-xl">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-900 uppercase tracking-wider text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="px-5 py-3.5">Ref</th>
                  <th className="px-5 py-3.5">Student</th>
                  <th className="px-5 py-3.5">Items</th>
                  <th className="px-5 py-3.5">Booking / Court</th>
                  <th className="px-5 py-3.5">Return Deadline</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Desk Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {checkouts.map((checkout) => {
                  const isOverdue = checkout.status === "OVERDUE" || checkout.isOverdue;
                  return (
                    <tr key={checkout._id} className="hover:bg-zinc-900/60 transition-colors">
                      <td className="px-5 py-4 font-mono text-zinc-500">
                        {checkout._id.slice(-6)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <UserIcon className="h-3.5 w-3.5 text-zinc-400" />
                          <span>{checkout.user?.name || "Student"}</span>
                        </div>
                        <div className="text-[11px] text-zinc-500 font-mono">
                          {checkout.user?.email}
                        </div>
                      </td>
                      <td className="px-5 py-4 font-semibold text-white">
                        {checkout.items
                          .map((i) => `${i.quantity}x ${i.equipment?.name || "Item"}`)
                          .join(", ")}
                      </td>
                      <td className="px-5 py-4">
                        {checkout.booking ? (
                          <div>
                            <span className="font-semibold text-white">
                              {checkout.booking.facility?.name}
                            </span>
                            <div className="text-[11px] text-zinc-500">
                              {new Date(checkout.booking.startAt).toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                              {" - "}
                              {new Date(checkout.booking.endAt).toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                        ) : (
                          <span className="text-zinc-500">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className={cn("font-bold", isOverdue ? "text-rose-400" : "text-zinc-300")}>
                          {new Date(checkout.expectedReturnAt).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          {new Date(checkout.expectedReturnAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={cn(
                            "px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase border",
                            isOverdue
                              ? "bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse"
                              : checkout.status === "ISSUED"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : checkout.status === "REQUESTED"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : "bg-zinc-800 text-zinc-400 border-zinc-700"
                          )}
                        >
                          {isOverdue ? "OVERDUE" : checkout.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {checkout.status === "REQUESTED" && (
                          <button
                            onClick={() => handleIssueEquipment(checkout._id)}
                            disabled={actionLoadingId === checkout._id}
                            className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-xs transition-colors shadow-md shadow-cyan-500/20 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            {actionLoadingId === checkout._id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Check className="h-3.5 w-3.5" />
                            )}
                            Issue Gear
                          </button>
                        )}

                        {(checkout.status === "ISSUED" || isOverdue) && (
                          <button
                            onClick={() => openReturnModal(checkout)}
                            className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition-colors border border-zinc-700 inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <RotateCcw className="h-3.5 w-3.5 text-cyan-400" />
                            Process Return
                          </button>
                        )}

                        {checkout.status === "RETURNED" && (
                          <span className="text-[11px] text-zinc-500">
                            Processed • {checkout.returnedAt ? new Date(checkout.returnedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "Done"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Return Process Modal */}
        {returnModalOpen && returningCheckout && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-lg rounded-3xl border border-zinc-800 bg-zinc-900 p-6 sm:p-8 shadow-2xl relative">
              <button
                onClick={() => setReturnModalOpen(false)}
                className="absolute top-6 right-6 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
                <RotateCcw className="h-4 w-4" /> Receive Equipment Return
              </div>
              <h3 className="text-xl font-black text-white">Process Gear Check-in</h3>
              <p className="text-xs text-zinc-400 mt-1 mb-5">
                Inspect equipment condition. Any damaged units will be isolated from available stock.
              </p>

              <div className="mb-5 p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs space-y-1">
                <div className="text-zinc-300 font-semibold">
                  Student: {returningCheckout.user?.name || "Student"} ({returningCheckout.user?.email})
                </div>
                <div className="text-zinc-400">
                  Ref: {returningCheckout._id.slice(-6)} • Issued:{" "}
                  {returningCheckout.issuedAt
                    ? new Date(returningCheckout.issuedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
                    : "—"}
                </div>
              </div>

              <form onSubmit={handleProcessReturn} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-2">
                    Item Inspection & Damaged Count
                  </label>
                  <div className="space-y-3">
                    {returningCheckout.items.map((item) => {
                      const equipId = item.equipment?._id;
                      const damagedVal = damagedCounts[equipId] || 0;
                      return (
                        <div
                          key={equipId}
                          className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800"
                        >
                          <div>
                            <div className="font-bold text-white text-xs">
                              {item.equipment?.name || "Equipment Item"}
                            </div>
                            <div className="text-[11px] text-zinc-500">
                              Issued: <strong className="text-zinc-300">{item.quantity}</strong> unit(s)
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-zinc-400">Damaged:</span>
                            <input
                              type="number"
                              min={0}
                              max={item.quantity}
                              value={damagedVal}
                              onChange={(e) => {
                                const val = Math.min(
                                  item.quantity,
                                  Math.max(0, parseInt(e.target.value) || 0)
                                );
                                setDamagedCounts((prev) => ({
                                  ...prev,
                                  [equipId]: val,
                                }));
                              }}
                              className="w-16 rounded-lg bg-zinc-900 border border-zinc-700 px-2.5 py-1 text-xs text-center text-white focus:outline-none focus:border-cyan-500 font-bold"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Return Notes / Damage Explanation
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Broken racket string, missing ball, regular wear and tear"
                    value={returnNotes}
                    onChange={(e) => setReturnNotes(e.target.value)}
                    className="w-full rounded-xl bg-zinc-950 border border-zinc-700 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {returnError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                    {returnError}
                  </div>
                )}

                <div className="pt-3 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setReturnModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={returnSubmitting}
                    className="px-5 py-2 text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-zinc-950 rounded-xl disabled:opacity-50 transition-colors shadow-lg shadow-cyan-500/20 flex items-center gap-2"
                  >
                    {returnSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Processing...
                      </>
                    ) : (
                      "Confirm & Restock"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
