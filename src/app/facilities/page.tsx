"use client";

import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import FacilityCard, { FacilityItem } from "@/components/dashboard/FacilityCard";
import EmptyState from "@/components/dashboard/EmptyState";
import {
  Search,
  Compass,
  MapPin,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { id: "ALL", label: "All Sports" },
  { id: "BADMINTON", label: "Badminton" },
  { id: "BASKETBALL", label: "Basketball" },
  { id: "FOOTBALL", label: "Football" },
  { id: "CRICKET", label: "Cricket" },
  { id: "TENNIS", label: "Tennis" },
  { id: "GYM", label: "Gym & Fitness" },
];

export default function FacilitiesPage() {
  const [facilities, setFacilities] = useState<FacilityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchFacilities = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      if (selectedCategory !== "ALL") params.set("sportType", selectedCategory);
      if (locationQuery.trim()) params.set("location", locationQuery.trim());
      params.set("page", page.toString());
      params.set("limit", "9");

      const res = await fetch(`/api/facilities?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to load facilities");
      }

      setFacilities(data.data || []);
      if (data.pagination) {
        setTotalPages(data.pagination.totalPages || 1);
        setTotalCount(data.pagination.total || 0);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, locationQuery, page]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchFacilities();
    }, 250);

    return () => clearTimeout(debounceTimer);
  }, [fetchFacilities]);

  const handleCategorySelect = (catId: string) => {
    setSelectedCategory(catId);
    setPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setPage(1);
  };

  const handleLocationChange = (val: string) => {
    setLocationQuery(val);
    setPage(1);
  };

  return (
    <DashboardLayout title="Explore Facilities">
      <div className="space-y-8">
        {/* Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-[var(--surface)] p-6 sm:p-8 shadow-xl">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-lime-400/10 border border-lime-400/20 px-3 py-0.5 text-xs font-bold text-lime-400 mb-2">
              <Compass className="h-3 w-3" /> Campus Sports Portfolio
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Discover Campus Facilities
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-400 leading-relaxed">
              Browse floodlit courts, turf grounds, and athletic fitness centers. Check operating hours, capacity limits, and sport specifications.
            </p>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search facility name or keywords..."
                className="w-full px-4 py-2.5 pl-10 rounded-xl bg-slate-900 border border-slate-800 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-lime-400 transition-colors"
              />
              <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>

            {/* Location Filter */}
            <div className="relative">
              <input
                type="text"
                value={locationQuery}
                onChange={(e) => handleLocationChange(e.target.value)}
                placeholder="Filter by campus location..."
                className="w-full px-4 py-2.5 pl-10 rounded-xl bg-slate-900 border border-slate-800 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-lime-400 transition-colors"
              />
              <MapPin className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>

            {/* Refresh / Results Count */}
            <div className="flex items-center justify-between sm:justify-end gap-3">
              <span className="text-xs text-slate-400 font-medium">
                {loading ? "Searching..." : `${totalCount} ${totalCount === 1 ? "facility" : "facilities"} found`}
              </span>
              <button
                onClick={() => fetchFacilities()}
                disabled={loading}
                title="Refresh list"
                className="p-2.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin text-lime-400")} />
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {CATEGORIES.map((category) => {
              const isSelected = selectedCategory === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategorySelect(category.id)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 border",
                    isSelected
                      ? "bg-lime-400 text-slate-950 border-lime-400 shadow-md shadow-lime-400/10"
                      : "bg-[var(--surface)] text-slate-400 border-slate-800 hover:bg-slate-900 hover:text-slate-200"
                  )}
                >
                  {category.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        {error ? (
          <div className="p-8 rounded-3xl border border-rose-500/20 bg-rose-500/5 text-center">
            <p className="text-sm font-bold text-rose-400">Failed to load facilities</p>
            <p className="text-xs text-slate-400 mt-1">{error}</p>
            <button
              onClick={() => fetchFacilities()}
              className="mt-4 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-white transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl border border-slate-800 bg-[var(--surface)] overflow-hidden"
              >
                <div className="h-44 bg-slate-900" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-slate-800 rounded-md w-3/4" />
                  <div className="h-3 bg-slate-800/60 rounded-md w-full" />
                  <div className="h-3 bg-slate-800/60 rounded-md w-1/2" />
                  <div className="h-10 bg-slate-800/80 rounded-xl mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : facilities.length === 0 ? (
          <EmptyState
            icon={Compass} art="trophy"
            title="No sports facilities found"
            description={
              searchQuery || locationQuery || selectedCategory !== "ALL"
                ? "No facilities matched your current search filters. Try clearing your search parameters."
                : "No facilities are currently registered in the database. Please check back later."
            }
            actionLabel="Reset Filters"
            actionHref="#"
          />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {facilities.map((facility) => (
                <FacilityCard key={facility._id || facility.id} facility={facility} />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-800 pt-6">
                <span className="text-xs text-slate-400">
                  Page <strong className="text-white">{page}</strong> of{" "}
                  <strong className="text-white">{totalPages}</strong>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
