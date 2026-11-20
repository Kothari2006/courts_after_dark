"use client";

import { useState, useEffect, useCallback } from "react";
import { Star, MessageSquare, Loader2, User, ChevronLeft, ChevronRight } from "lucide-react";

interface FacilityReviewsSectionProps {
  facilityId: string;
}

export default function FacilityReviewsSection({
  facilityId,
}: FacilityReviewsSectionProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const limit = 5;

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/facilities/${facilityId}/reviews?page=${page}&limit=${limit}`);
      const json = await res.json();
      if (res.ok) {
        setData(json);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [facilityId, page]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const ratingDistribution = data?.ratingDistribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const totalReviews = data?.totalReviews || 0;
  const averageRating = data?.averageRating;

  return (
    <div className="rounded-3xl border border-slate-800 bg-[var(--surface)] p-6 sm:p-8 space-y-8 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-lime-400">
            Ratings & Feedback
          </span>
          <h2 className="text-2xl font-black text-white tracking-tight mt-0.5">
            Student & Faculty Reviews
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Verified ratings submitted by players who have completed matches at this facility.
          </p>
        </div>
      </div>

      {loading && !data ? (
        <div className="py-12 flex justify-center items-center text-lime-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : totalReviews === 0 ? (
        <div className="py-12 text-center space-y-3">
          <div className="h-12 w-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto">
            <MessageSquare className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-white">No reviews yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            This court has not received any reviews yet. Complete a booking here and be the first to share your experience!
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Rating Summary & Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 items-center">
            {/* Average Rating Big Display */}
            <div className="text-center md:border-r border-slate-800 md:pr-6 space-y-2">
              <div className="text-5xl font-black text-white tracking-tight">
                {averageRating?.toFixed(1) || "5.0"}
              </div>
              <div className="flex items-center justify-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`h-5 w-5 ${
                      (averageRating || 5) >= s
                        ? "fill-lime-400 text-lime-400"
                        : "text-slate-700"
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-slate-400">
                Based on <span className="font-bold text-white">{totalReviews}</span> verified {totalReviews === 1 ? "review" : "reviews"}
              </p>
            </div>

            {/* Distribution Bars */}
            <div className="md:col-span-2 space-y-2 text-xs">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = ratingDistribution[stars as keyof typeof ratingDistribution] || 0;
                const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

                return (
                  <div key={stars} className="flex items-center gap-3">
                    <span className="w-12 font-bold text-slate-400 flex items-center gap-1 justify-end">
                      {stars} <Star className="h-3 w-3 fill-lime-400 text-lime-400 inline" />
                    </span>

                    <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-lime-400 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <span className="w-10 text-[11px] text-slate-500 text-right font-medium">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reviews List */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Recent Player Feedback
            </h3>

            <div className="space-y-3">
              {data?.reviews?.map((r: any) => (
                <div
                  key={r._id}
                  className="p-5 rounded-2xl border border-slate-800 bg-[var(--app-bg)] space-y-3 shadow-md hover:border-slate-700 transition-colors"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-lime-400/10 border border-lime-400/30 flex items-center justify-center text-lime-400 font-bold text-xs">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">
                          {r.reviewerName}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(r.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
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
                  </div>

                  {r.title && (
                    <h4 className="text-sm font-bold text-white tracking-tight">
                      {r.title}
                    </h4>
                  )}

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {r.comment}
                  </p>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {data?.pagination?.totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs text-slate-400">
                <span>
                  Page {data.pagination.page} of {data.pagination.totalPages}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Previous reviews page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    disabled={page >= data.pagination.totalPages}
                    onClick={() => setPage((prev) => prev + 1)}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Next reviews page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

