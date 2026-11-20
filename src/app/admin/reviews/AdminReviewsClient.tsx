"use client";

import { useState, useCallback } from "react";
import {
  Star,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Loader2,
  Eye,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  History,
  MessageSquare,
} from "lucide-react";

interface AdminReviewsClientProps {
  initialData: {
    reviews: any[];
    counts: {
      total: number;
      pending: number;
      approved: number;
      rejected: number;
    };
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export default function AdminReviewsClient({ initialData }: AdminReviewsClientProps) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  // Review details modal
  const [selectedReview, setSelectedReview] = useState<any | null>(null);

  // Reject modal
  const [rejectingReview, setRejectingReview] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isSubmittingModeration, setIsSubmittingModeration] = useState(false);
  const [moderationError, setModerationError] = useState<string | null>(null);

  const fetchReviews = useCallback(
    async (targetPage = page, targetStatus = statusFilter, targetSearch = searchQuery) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", targetPage.toString());
        params.set("limit", "15");
        if (targetStatus !== "ALL") params.set("status", targetStatus);
        if (targetSearch.trim()) params.set("search", targetSearch.trim());

        const res = await fetch(`/api/admin/reviews?${params.toString()}`);
        const json = await res.json();
        if (res.ok) {
          setData(json);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    },
    [page, statusFilter, searchQuery]
  );

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setPage(1);
    fetchReviews(1, status, searchQuery);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchReviews(1, statusFilter, searchQuery);
  };

  const handleModerate = async (reviewId: string, status: "APPROVED" | "REJECTED", reason?: string) => {
    setIsSubmittingModeration(true);
    setModerationError(null);

    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}/moderate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reason }),
      });

      const resData = await res.json();
      if (!res.ok) {
        setModerationError(resData.message || "Failed to update review moderation status");
        return;
      }

      // Close modals
      setRejectingReview(null);
      setRejectReason("");
      setSelectedReview(null);

      // Refresh list
      fetchReviews();
    } catch {
      setModerationError("Network communication error.");
    } finally {
      setIsSubmittingModeration(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime-400/10 border border-lime-400/20 text-xs font-bold text-lime-400 mb-2">
            <ShieldCheck className="h-3.5 w-3.5" /> Administrative Moderation
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Facility Reviews & Ratings
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Moderate player reviews, approve verified court feedback, and reject abusive or inappropriate content.
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Total Reviews</span>
            <MessageSquare className="h-4 w-4 text-zinc-500" />
          </div>
          <div className="text-3xl font-black text-white mt-3">{data.counts.total}</div>
          <p className="text-[11px] text-zinc-500 mt-1">All time player feedback</p>
        </div>

        <div className="p-5 rounded-2xl border border-amber-500/30 bg-amber-500/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Pending Review</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-amber-400 mt-3">{data.counts.pending}</div>
          <p className="text-[11px] text-amber-400/70 mt-1">Awaiting moderation action</p>
        </div>

        <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Approved</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400 mt-3">{data.counts.approved}</div>
          <p className="text-[11px] text-emerald-400/70 mt-1">Publicly visible on facility pages</p>
        </div>

        <div className="p-5 rounded-2xl border border-rose-500/30 bg-rose-500/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400">Rejected</span>
            <XCircle className="h-4 w-4 text-rose-400" />
          </div>
          <div className="text-3xl font-black text-rose-400 mt-3">{data.counts.rejected}</div>
          <p className="text-[11px] text-rose-400/70 mt-1">Hidden from public ratings</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl border border-zinc-800 bg-zinc-900/60">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {["ALL", "PENDING", "APPROVED", "REJECTED"].map((st) => (
            <button
              key={st}
              onClick={() => handleStatusFilterChange(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 ${
                statusFilter === st
                  ? "bg-lime-400 text-zinc-950 border-lime-400 shadow-md shadow-lime-400/10"
                  : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white"
              }`}
            >
              {st === "ALL" ? "All Reviews" : st}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative sm:w-72">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search facility or reviewer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-lime-400"
          />
        </form>
      </div>

      {/* Reviews Table */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900/80 border-b border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">Facility</th>
                <th className="p-4">Reviewer</th>
                <th className="p-4">Rating</th>
                <th className="p-4">Feedback Preview</th>
                <th className="p-4">Status</th>
                <th className="p-4">Date</th>
                <th className="p-4 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80 text-zinc-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-lime-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : data.reviews.length > 0 ? (
                data.reviews.map((r) => (
                  <tr key={r._id} className="hover:bg-zinc-900/60 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-white">{r.facility?.name || "Facility"}</div>
                      <div className="text-[10px] text-zinc-500">{r.facility?.sportType}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-zinc-200">{r.user?.name || "Student"}</div>
                      <div className="text-[10px] text-zinc-500">{r.user?.email}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-white mr-1">{r.rating}</span>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`h-3 w-3 ${
                              r.rating >= s
                                ? "fill-lime-400 text-lime-400"
                                : "text-zinc-700"
                            }`}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="p-4 max-w-xs">
                      {r.title && <div className="font-bold text-white truncate">{r.title}</div>}
                      <div className="text-zinc-400 line-clamp-1">{r.comment}</div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          r.status === "APPROVED"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : r.status === "REJECTED"
                            ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-400">
                      {new Date(r.createdAt).toLocaleDateString("en-US")}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedReview(r)}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                          title="View Details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>

                        {r.status !== "APPROVED" && (
                          <button
                            onClick={() => handleModerate(r._id, "APPROVED")}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold border border-emerald-500/30"
                            title="Approve Review"
                          >
                            Approve
                          </button>
                        )}

                        {r.status !== "REJECTED" && (
                          <button
                            onClick={() => setRejectingReview(r)}
                            className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold border border-rose-500/30"
                            title="Reject Review"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-zinc-500">
                    No reviews found matching the filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-zinc-800 text-xs text-zinc-400">
            <span>
              Showing Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} total)
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => {
                  const newPage = Math.max(1, page - 1);
                  setPage(newPage);
                  fetchReviews(newPage);
                }}
                className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={page >= data.pagination.totalPages}
                onClick={() => {
                  const newPage = page + 1;
                  setPage(newPage);
                  fetchReviews(newPage);
                }}
                className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-zinc-800 bg-zinc-900 p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setSelectedReview(null)}
              className="absolute right-5 top-5 p-1 rounded-lg text-zinc-400 hover:text-white"
            >
              ✕
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    selectedReview.status === "APPROVED"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : selectedReview.status === "REJECTED"
                      ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                  }`}
                >
                  {selectedReview.status}
                </span>
                <span className="text-xs text-zinc-500">
                  ID: {selectedReview._id}
                </span>
              </div>
              <h3 className="text-lg font-black text-white mt-1">Review Details</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block">Facility</span>
                  <span className="font-bold text-white">{selectedReview.facility?.name}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block">Reviewer</span>
                  <span className="font-bold text-white">{selectedReview.user?.name}</span>
                  <span className="block text-[11px] text-zinc-400">{selectedReview.user?.email}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-zinc-500">Rating</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-3.5 w-3.5 ${
                          selectedReview.rating >= s ? "fill-lime-400 text-lime-400" : "text-zinc-700"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {selectedReview.title && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-500 block">Title</span>
                    <span className="font-bold text-white">{selectedReview.title}</span>
                  </div>
                )}

                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block">Comment</span>
                  <p className="text-zinc-300 leading-relaxed mt-0.5">{selectedReview.comment}</p>
                </div>
              </div>

              {/* Moderation Audit History */}
              {selectedReview.moderationHistory?.length > 0 && (
                <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 flex items-center gap-1.5">
                    <History className="h-3.5 w-3.5 text-lime-400" /> Moderation Audit Trail
                  </span>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {selectedReview.moderationHistory.map((h: any, idx: number) => (
                      <div key={idx} className="text-[11px] border-l-2 border-zinc-700 pl-2 py-0.5">
                        <span className="text-zinc-400">
                          {new Date(h.timestamp).toLocaleString("en-US")}: Changed from{" "}
                          <span className="font-bold text-zinc-300">{h.previousStatus}</span> to{" "}
                          <span className="font-bold text-white">{h.newStatus}</span>
                        </span>
                        {h.reason && <p className="text-zinc-400 italic mt-0.5">"{h.reason}"</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
              <button
                onClick={() => setSelectedReview(null)}
                className="px-4 py-2 rounded-xl border border-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                {selectedReview.status !== "APPROVED" && (
                  <button
                    onClick={() => handleModerate(selectedReview._id, "APPROVED")}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs"
                  >
                    Approve Review
                  </button>
                )}

                {selectedReview.status !== "REJECTED" && (
                  <button
                    onClick={() => {
                      setRejectingReview(selectedReview);
                      setSelectedReview(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs"
                  >
                    Reject Review
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Dialog */}
      {rejectingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-rose-500/30 bg-zinc-900 p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => {
                setRejectingReview(null);
                setRejectReason("");
                setModerationError(null);
              }}
              className="absolute right-5 top-5 p-1 rounded-lg text-zinc-400 hover:text-white"
            >
              ✕
            </button>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Reject Player Review</h3>
                <p className="text-xs text-zinc-400">Please provide a reason for rejecting this review.</p>
              </div>
            </div>

            {moderationError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {moderationError}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-zinc-300 uppercase mb-1">
                  Rejection Reason:
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Inappropriate language, false claims, promotional spam..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-400 text-[11px]">
                Notice: The review will be hidden from public ratings and facility pages. The author can see the moderation status in their booking history.
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setRejectingReview(null);
                    setRejectReason("");
                  }}
                  className="px-4 py-2 rounded-xl border border-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmittingModeration || rejectReason.trim().length < 3}
                  onClick={() => handleModerate(rejectingReview._id, "REJECTED", rejectReason)}
                  className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold disabled:opacity-40"
                >
                  {isSubmittingModeration ? "Rejecting..." : "Confirm Rejection"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

