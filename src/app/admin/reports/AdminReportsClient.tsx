"use client";

import { useState, useCallback } from "react";
import {
  Download,
  Calendar,
  Filter,
  RefreshCw,
  CalendarDays,
  Activity,
  Package,
  Wrench,
  Users,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";

export type ReportCategory =
  | "bookings"
  | "facilities"
  | "equipment"
  | "maintenance"
  | "users";

export type PeriodOption = "7d" | "30d" | "90d" | "custom";

interface FacilityOption {
  _id: string;
  name: string;
  sportType: string;
}

interface AdminReportsClientProps {
  initialBookingsData: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    summary: Record<string, any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  };
  facilities: FacilityOption[];
}

export default function AdminReportsClient({
  initialBookingsData,
  facilities,
}: AdminReportsClientProps) {
  // Category & Period State
  const [category, setCategory] = useState<ReportCategory>("bookings");
  const [period, setPeriod] = useState<PeriodOption>("30d");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Filters State
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sportFilter, setSportFilter] = useState("ALL");
  const [facilityFilter, setFacilityFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [accountStatusFilter, setAccountStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  // Data & Loading State
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [reportData, setReportData] = useState<any[]>(initialBookingsData.data || []);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [summaryStats, setSummaryStats] = useState<Record<string, any>>(
    initialBookingsData.summary || {}
  );
  const [pagination, setPagination] = useState(initialBookingsData.pagination);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch report preview
  const fetchReport = useCallback(
    async (overrides?: {
      targetCategory?: ReportCategory;
      targetPeriod?: PeriodOption;
      page?: number;
      status?: string;
      sportType?: string;
      facilityId?: string;
      role?: string;
      accountStatus?: string;
      startDate?: string;
      endDate?: string;
    }) => {
      setLoading(true);
      setError(null);

      const cat = overrides?.targetCategory ?? category;
      const per = overrides?.targetPeriod ?? period;
      const qPage = overrides?.page ?? page;
      const qStatus = overrides?.status ?? statusFilter;
      const qSport = overrides?.sportType ?? sportFilter;
      const qFac = overrides?.facilityId ?? facilityFilter;
      const qRole = overrides?.role ?? roleFilter;
      const qAcc = overrides?.accountStatus ?? accountStatusFilter;
      const qStart = overrides?.startDate ?? startDate;
      const qEnd = overrides?.endDate ?? endDate;

      try {
        const params = new URLSearchParams();
        params.set("period", per);
        params.set("page", qPage.toString());
        params.set("limit", "15");
        params.set("format", "preview");

        if (per === "custom" && qStart && qEnd) {
          params.set("startDate", qStart);
          params.set("endDate", qEnd);
        }

        if (qStatus !== "ALL") params.set("status", qStatus);
        if (qSport !== "ALL") params.set("sportType", qSport);
        if (qFac !== "ALL") params.set("facilityId", qFac);
        if (qRole !== "ALL") params.set("role", qRole);
        if (qAcc !== "ALL") params.set("accountStatus", qAcc);

        const res = await fetch(`/api/admin/reports/${cat}?${params.toString()}`);
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.message || "Failed to load report data");
        }

        setReportData(json.data || []);
        setSummaryStats(json.summary || {});
        setPagination(
          json.pagination || { total: 0, page: 1, limit: 15, totalPages: 1 }
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error fetching report");
      } finally {
        setLoading(false);
      }
    },
    [
      category,
      period,
      page,
      statusFilter,
      sportFilter,
      facilityFilter,
      roleFilter,
      accountStatusFilter,
      startDate,
      endDate,
    ]
  );

  // Switch category
  const handleCategoryChange = (newCat: ReportCategory) => {
    setCategory(newCat);
    setPage(1);
    setStatusFilter("ALL");
    setSportFilter("ALL");
    setFacilityFilter("ALL");
    setRoleFilter("ALL");
    setAccountStatusFilter("ALL");
    fetchReport({
      targetCategory: newCat,
      page: 1,
      status: "ALL",
      sportType: "ALL",
      facilityId: "ALL",
      role: "ALL",
      accountStatus: "ALL",
    });
  };

  // Switch period
  const handlePeriodChange = (newPer: PeriodOption) => {
    setPeriod(newPer);
    setPage(1);
    if (newPer !== "custom") {
      fetchReport({ targetPeriod: newPer, page: 1 });
    }
  };

  // Trigger CSV Download
  const handleExportCsv = async () => {
    setDownloading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("period", period);
      params.set("format", "csv");

      if (period === "custom" && startDate && endDate) {
        params.set("startDate", startDate);
        params.set("endDate", endDate);
      }

      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (sportFilter !== "ALL") params.set("sportType", sportFilter);
      if (facilityFilter !== "ALL") params.set("facilityId", facilityFilter);
      if (roleFilter !== "ALL") params.set("role", roleFilter);
      if (accountStatusFilter !== "ALL") params.set("accountStatus", accountStatusFilter);

      const downloadUrl = `/api/admin/reports/${category}?${params.toString()}`;

      // Create an invisible link to trigger the browser's native file download
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", "");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setTimeout(() => setDownloading(false), 800);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <FileSpreadsheet className="w-7 h-7 text-emerald-400" />
            Reports & CSV Export
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Generate, preview, and download audit-ready CSV reports for campus athletic operations
          </p>
        </div>

        {/* Global Export Button */}
        <button
          onClick={handleExportCsv}
          disabled={downloading || loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-bold text-xs transition-colors shadow-lg shadow-emerald-500/20 self-start sm:self-auto"
        >
          <Download className={`w-4 h-4 ${downloading ? "animate-bounce" : ""}`} />
          {downloading ? "Preparing CSV..." : "Export CSV Report"}
        </button>
      </div>

      {/* Category Tab Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 bg-zinc-900/60 p-2 rounded-2xl border border-zinc-800/80">
        <button
          onClick={() => handleCategoryChange("bookings")}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
            category === "bookings"
              ? "bg-zinc-800 text-emerald-400 border border-emerald-500/30 shadow-sm"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>Bookings</span>
        </button>

        <button
          onClick={() => handleCategoryChange("facilities")}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
            category === "facilities"
              ? "bg-zinc-800 text-emerald-400 border border-emerald-500/30 shadow-sm"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Utilization</span>
        </button>

        <button
          onClick={() => handleCategoryChange("equipment")}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
            category === "equipment"
              ? "bg-zinc-800 text-emerald-400 border border-emerald-500/30 shadow-sm"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Equipment</span>
        </button>

        <button
          onClick={() => handleCategoryChange("maintenance")}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
            category === "maintenance"
              ? "bg-zinc-800 text-emerald-400 border border-emerald-500/30 shadow-sm"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Maintenance</span>
        </button>

        <button
          onClick={() => handleCategoryChange("users")}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all col-span-2 sm:col-span-1 ${
            category === "users"
              ? "bg-zinc-800 text-emerald-400 border border-emerald-500/30 shadow-sm"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Users</span>
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-400 text-xs">
            ✕
          </button>
        </div>
      )}

      {/* Date Range & Filter Controls */}
      <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
        {/* Period Selector row */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Reporting Period:
            </span>
            <div className="inline-flex rounded-xl bg-zinc-950 p-1 border border-zinc-800">
              {(["7d", "30d", "90d", "custom"] as PeriodOption[]).map((p) => (
                <button
                  key={p}
                  onClick={() => handlePeriodChange(p)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    period === p
                      ? "bg-zinc-800 text-emerald-400"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {p === "7d"
                    ? "Last 7 Days"
                    : p === "30d"
                    ? "Last 30 Days"
                    : p === "90d"
                    ? "Last 90 Days"
                    : "Custom Range"}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => fetchReport()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-xs font-semibold transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-400" : ""}`} />
            Refresh Preview
          </button>
        </div>

        {/* Custom Date Pickers */}
        {period === "custom" && (
          <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-zinc-400" />
              <span className="text-xs text-zinc-300 font-medium">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-300 font-medium">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              onClick={() => {
                if (startDate && endDate) {
                  setPage(1);
                  fetchReport({ startDate, endDate, page: 1 });
                }
              }}
              disabled={!startDate || !endDate || loading}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-bold text-xs transition-colors"
            >
              Apply Dates
            </button>
          </div>
        )}

        {/* Category Specific Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          {/* Status filter for Bookings & Maintenance */}
          {(category === "bookings" || category === "maintenance" || category === "equipment") && (
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Status Filter
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  setStatusFilter(val);
                  setPage(1);
                  fetchReport({ status: val, page: 1 });
                }}
                className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Statuses</option>
                {category === "bookings" && (
                  <>
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="PENDING">PENDING</option>
                    <option value="CANCELLED">CANCELLED</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="REJECTED">REJECTED</option>
                  </>
                )}
                {category === "maintenance" && (
                  <>
                    <option value="SCHEDULED">SCHEDULED</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </>
                )}
                {category === "equipment" && (
                  <>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="DAMAGED">DAMAGED</option>
                  </>
                )}
              </select>
            </div>
          )}

          {/* Sport filter for Bookings & Facilities */}
          {(category === "bookings" || category === "facilities") && (
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Sport Category
              </label>
              <select
                value={sportFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  setSportFilter(val);
                  setPage(1);
                  fetchReport({ sportType: val, page: 1 });
                }}
                className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Sports</option>
                <option value="BADMINTON">Badminton</option>
                <option value="BASKETBALL">Basketball</option>
                <option value="FOOTBALL">Football</option>
                <option value="CRICKET">Cricket</option>
                <option value="TENNIS">Tennis</option>
                <option value="GYM">Gym</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          )}

          {/* Facility filter for Bookings, Facilities, Maintenance */}
          {(category === "bookings" || category === "facilities" || category === "maintenance") && (
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Facility
              </label>
              <select
                value={facilityFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  setFacilityFilter(val);
                  setPage(1);
                  fetchReport({ facilityId: val, page: 1 });
                }}
                className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 truncate"
              >
                <option value="ALL">All Facilities</option>
                {facilities.map((f) => (
                  <option key={f._id} value={f._id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* User role filter */}
          {category === "users" && (
            <>
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                  User Role
                </label>
                <select
                  value={roleFilter}
                  onChange={(e) => {
                    const val = e.target.value;
                    setRoleFilter(val);
                    setPage(1);
                    fetchReport({ role: val, page: 1 });
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="ALL">All Roles</option>
                  <option value="STUDENT">Student</option>
                  <option value="TEACHER">Teacher / Faculty</option>
                  <option value="ADMIN">Admin</option>
                  <option value="EQUIPMENT_MANAGER">Equipment Manager</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                  Account Status
                </label>
                <select
                  value={accountStatusFilter}
                  onChange={(e) => {
                    const val = e.target.value;
                    setAccountStatusFilter(val);
                    setPage(1);
                    fetchReport({ accountStatus: val, page: 1 });
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Deactivated</option>
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Summary Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {category === "bookings" && (
          <>
            <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
              <p className="text-[10px] font-semibold text-zinc-400 uppercase">Total Bookings</p>
              <p className="text-xl font-bold text-white mt-1">{summaryStats.total ?? 0}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
              <p className="text-[10px] font-semibold text-emerald-400 uppercase">Confirmed</p>
              <p className="text-xl font-bold text-emerald-400 mt-1">{summaryStats.confirmed ?? 0}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
              <p className="text-[10px] font-semibold text-rose-400 uppercase">Cancelled</p>
              <p className="text-xl font-bold text-rose-400 mt-1">{summaryStats.cancelled ?? 0}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
              <p className="text-[10px] font-semibold text-sky-400 uppercase">Completed</p>
              <p className="text-xl font-bold text-sky-400 mt-1">{summaryStats.completed ?? 0}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
              <p className="text-[10px] font-semibold text-amber-400 uppercase">Prime-Time</p>
              <p className="text-xl font-bold text-amber-400 mt-1">{summaryStats.primeTime ?? 0}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
              <p className="text-[10px] font-semibold text-zinc-400 uppercase">Rejected</p>
              <p className="text-xl font-bold text-zinc-300 mt-1">{summaryStats.rejected ?? 0}</p>
            </div>
          </>
        )}

        {category === "facilities" && (
          <>
            <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
              <p className="text-[10px] font-semibold text-zinc-400 uppercase">Total Facilities</p>
              <p className="text-xl font-bold text-white mt-1">{summaryStats.totalFacilities ?? 0}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
              <p className="text-[10px] font-semibold text-emerald-400 uppercase">Avg Utilization</p>
              <p className="text-xl font-bold text-emerald-400 mt-1">
                {summaryStats.averageUtilizationPercentage ?? 0}%
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
              <p className="text-[10px] font-semibold text-zinc-400 uppercase">Confirmed Hours</p>
              <p className="text-xl font-bold text-zinc-200 mt-1">{summaryStats.totalConfirmedHours ?? 0} hrs</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
              <p className="text-[10px] font-semibold text-zinc-400 uppercase">Operating Hours</p>
              <p className="text-xl font-bold text-zinc-200 mt-1">{summaryStats.totalAvailableHours ?? 0} hrs</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 col-span-2">
              <p className="text-[10px] font-semibold text-amber-400 uppercase">Top Court</p>
              <p className="text-sm font-bold text-zinc-200 mt-1 truncate">
                {summaryStats.topUtilizedFacility ?? "None"}
              </p>
            </div>
          </>
        )}

        {category === "equipment" && (
          <>
            <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
              <p className="text-[10px] font-semibold text-zinc-400 uppercase">Item Types</p>
              <p className="text-xl font-bold text-white mt-1">{summaryStats.totalItemTypes ?? 0}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
              <p className="text-[10px] font-semibold text-zinc-400 uppercase">Total Inventory</p>
              <p className="text-xl font-bold text-white mt-1">{summaryStats.totalUnits ?? 0}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
              <p className="text-[10px] font-semibold text-emerald-400 uppercase">Available</p>
              <p className="text-xl font-bold text-emerald-400 mt-1">{summaryStats.availableUnits ?? 0}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
              <p className="text-[10px] font-semibold text-cyan-400 uppercase">Issued</p>
              <p className="text-xl font-bold text-cyan-400 mt-1">{summaryStats.issuedUnits ?? 0}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
              <p className="text-[10px] font-semibold text-rose-400 uppercase">Damaged</p>
              <p className="text-xl font-bold text-rose-400 mt-1">{summaryStats.damagedUnits ?? 0}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
              <p className="text-[10px] font-semibold text-amber-400 uppercase">Overdue</p>
              <p className="text-xl font-bold text-amber-400 mt-1">{summaryStats.overdueCheckouts ?? 0}</p>
            </div>
          </>
        )}

        {category === "maintenance" && (
          <>
            <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
              <p className="text-[10px] font-semibold text-zinc-400 uppercase">Total Records</p>
              <p className="text-xl font-bold text-white mt-1">{summaryStats.total ?? 0}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
              <p className="text-[10px] font-semibold text-amber-400 uppercase">Scheduled</p>
              <p className="text-xl font-bold text-amber-400 mt-1">{summaryStats.scheduled ?? 0}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
              <p className="text-[10px] font-semibold text-cyan-400 uppercase">In Progress</p>
              <p className="text-xl font-bold text-cyan-400 mt-1">{summaryStats.inProgress ?? 0}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
              <p className="text-[10px] font-semibold text-emerald-400 uppercase">Completed</p>
              <p className="text-xl font-bold text-emerald-400 mt-1">{summaryStats.completed ?? 0}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 col-span-2 sm:col-span-1">
              <p className="text-[10px] font-semibold text-rose-400 uppercase">Cancelled</p>
              <p className="text-xl font-bold text-rose-400 mt-1">{summaryStats.cancelled ?? 0}</p>
            </div>
          </>
        )}

        {category === "users" && (
          <>
            <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
              <p className="text-[10px] font-semibold text-zinc-400 uppercase">Registrations</p>
              <p className="text-xl font-bold text-white mt-1">{summaryStats.total ?? 0}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
              <p className="text-[10px] font-semibold text-emerald-400 uppercase">Students</p>
              <p className="text-xl font-bold text-emerald-400 mt-1">{summaryStats.students ?? 0}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
              <p className="text-[10px] font-semibold text-purple-400 uppercase">Faculty</p>
              <p className="text-xl font-bold text-purple-400 mt-1">{summaryStats.teachers ?? 0}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
              <p className="text-[10px] font-semibold text-amber-400 uppercase">Staff / Admins</p>
              <p className="text-xl font-bold text-amber-400 mt-1">
                {(summaryStats.admins ?? 0) + (summaryStats.equipmentManagers ?? 0)}
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
              <p className="text-[10px] font-semibold text-emerald-400 uppercase">Active</p>
              <p className="text-xl font-bold text-emerald-400 mt-1">{summaryStats.active ?? 0}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
              <p className="text-[10px] font-semibold text-rose-400 uppercase">Deactivated</p>
              <p className="text-xl font-bold text-rose-400 mt-1">{summaryStats.inactive ?? 0}</p>
            </div>
          </>
        )}
      </div>

      {/* Preview Table Container */}
      <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              {category.toUpperCase()} REPORT PREVIEW
            </span>
            <span className="text-[11px] font-mono text-zinc-500">
              ({pagination.total} total matching records)
            </span>
          </div>

          <button
            onClick={handleExportCsv}
            disabled={downloading || loading || pagination.total === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            Download .CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950/60 border-b border-zinc-800 text-zinc-400 uppercase text-[10px] tracking-wider font-semibold">
              {/* Dynamic Headers based on category */}
              {category === "bookings" && (
                <tr>
                  <th className="py-3 px-4">Booking ID</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Facility</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created Date</th>
                </tr>
              )}

              {category === "facilities" && (
                <tr>
                  <th className="py-3 px-4">Facility Name</th>
                  <th className="py-3 px-4">Sport</th>
                  <th className="py-3 px-4">Operating Hours</th>
                  <th className="py-3 px-4">Confirmed Hours</th>
                  <th className="py-3 px-4">Available Hours</th>
                  <th className="py-3 px-4">Utilization %</th>
                </tr>
              )}

              {category === "equipment" && (
                <tr>
                  <th className="py-3 px-4">Equipment Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Total Qty</th>
                  <th className="py-3 px-4">Available</th>
                  <th className="py-3 px-4">Issued</th>
                  <th className="py-3 px-4">Damaged</th>
                  <th className="py-3 px-4">Checkouts (Period)</th>
                  <th className="py-3 px-4">Overdue</th>
                </tr>
              )}

              {category === "maintenance" && (
                <tr>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Facility</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Start At</th>
                  <th className="py-3 px-4">End At</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created By</th>
                </tr>
              )}

              {category === "users" && (
                <tr>
                  <th className="py-3 px-4">User Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4">Registration Date</th>
                </tr>
              )}
            </thead>

            <tbody className="divide-y divide-zinc-800/60">
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td colSpan={7} className="py-4 px-4">
                      <div className="h-4 bg-zinc-800/60 rounded w-full"></div>
                    </td>
                  </tr>
                ))
              ) : reportData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-500">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <Filter className="w-8 h-8 text-zinc-600 mb-1" />
                      <p className="font-semibold text-sm text-zinc-300">
                        No records found in this reporting window
                      </p>
                      <p className="text-xs text-zinc-500">
                        Try selecting another reporting period or clearing filters
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                reportData.map((row) => (
                  <tr key={row._id || row.facilityId} className="hover:bg-zinc-800/30 transition-colors">
                    {/* BOOKINGS ROW */}
                    {category === "bookings" && (
                      <>
                        <td className="py-3 px-4 font-mono text-[11px] text-zinc-400">
                          #{row._id.slice(-6).toUpperCase()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-zinc-200">{row.user?.name || "Student"}</div>
                          <div className="text-[11px] text-zinc-500">{row.user?.email}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-zinc-200 font-medium">{row.facility?.name}</div>
                          <div className="text-[10px] text-zinc-500">{row.facility?.sportType}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-zinc-200">
                            {row.bookingDate ? new Date(row.bookingDate).toISOString().split("T")[0] : ""}
                          </div>
                          <div className="text-[11px] text-zinc-400 font-mono">
                            {row.startTime} - {row.endTime}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              row.bookingType === "PRIME_TIME"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : "bg-zinc-800 text-zinc-400"
                            }`}
                          >
                            {row.bookingType}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              row.status === "CONFIRMED"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                : row.status === "CANCELLED"
                                ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                                : row.status === "COMPLETED"
                                ? "bg-sky-500/10 text-sky-400 border border-sky-500/30"
                                : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-zinc-400 text-[11px]">
                          {new Date(row.createdAt).toLocaleDateString("en-US")}
                        </td>
                      </>
                    )}

                    {/* FACILITIES ROW */}
                    {category === "facilities" && (
                      <>
                        <td className="py-3 px-4 font-semibold text-zinc-200">{row.facilityName}</td>
                        <td className="py-3 px-4 font-mono text-[11px] text-zinc-400">{row.sportType}</td>
                        <td className="py-3 px-4 text-zinc-300">{row.operatingHours}</td>
                        <td className="py-3 px-4 font-mono text-zinc-200">{row.confirmedBookingHours} hrs</td>
                        <td className="py-3 px-4 font-mono text-zinc-400">{row.availableOperatingHours} hrs</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              row.utilizationPercentage > 50
                                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                : row.utilizationPercentage > 20
                                ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                                : "bg-zinc-800 text-zinc-400"
                            }`}
                          >
                            {row.utilizationPercentage}%
                          </span>
                        </td>
                      </>
                    )}

                    {/* EQUIPMENT ROW */}
                    {category === "equipment" && (
                      <>
                        <td className="py-3 px-4 font-semibold text-zinc-200">{row.name}</td>
                        <td className="py-3 px-4 text-zinc-400 font-mono text-[11px]">{row.category}</td>
                        <td className="py-3 px-4 font-mono text-zinc-200">{row.totalQuantity}</td>
                        <td className="py-3 px-4 font-mono text-emerald-400">{row.availableQuantity}</td>
                        <td className="py-3 px-4 font-mono text-cyan-400">{row.issuedQuantity}</td>
                        <td className="py-3 px-4 font-mono text-rose-400">{row.damagedQuantity}</td>
                        <td className="py-3 px-4 font-mono text-zinc-300">{row.totalCheckouts}</td>
                        <td className="py-3 px-4 font-mono text-amber-400">{row.overdueCheckouts}</td>
                      </>
                    )}

                    {/* MAINTENANCE ROW */}
                    {category === "maintenance" && (
                      <>
                        <td className="py-3 px-4 font-mono text-[11px] text-zinc-500">
                          #{row._id.slice(-6).toUpperCase()}
                        </td>
                        <td className="py-3 px-4 font-semibold text-zinc-200">{row.facility?.name}</td>
                        <td className="py-3 px-4 text-zinc-300 max-w-xs truncate">{row.reason}</td>
                        <td className="py-3 px-4 text-zinc-400 text-[11px]">
                          {new Date(row.startAt).toLocaleString("en-US")}
                        </td>
                        <td className="py-3 px-4 text-zinc-400 text-[11px]">
                          {new Date(row.endAt).toLocaleString("en-US")}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                            {row.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-zinc-400 text-[11px]">
                          {row.createdBy?.email || "Admin"}
                        </td>
                      </>
                    )}

                    {/* USERS ROW */}
                    {category === "users" && (
                      <>
                        <td className="py-3 px-4 font-semibold text-zinc-200">{row.name}</td>
                        <td className="py-3 px-4 text-zinc-400 font-mono text-[11px]">{row.email}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                              row.role === "ADMIN"
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                : row.role === "TEACHER"
                                ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            }`}
                          >
                            {row.role}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              row.isActive
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-rose-500/10 text-rose-400"
                            }`}
                          >
                            {row.isActive ? "ACTIVE" : "INACTIVE"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-zinc-400 text-[11px]">
                          {new Date(row.createdAt).toLocaleDateString("en-US")}
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="bg-zinc-950/60 border-t border-zinc-800 px-4 py-3 flex items-center justify-between text-xs text-zinc-400">
          <div>
            Showing{" "}
            <span className="font-semibold text-zinc-200">
              {reportData.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-zinc-200">
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>{" "}
            of <span className="font-semibold text-zinc-200">{pagination.total}</span> records
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                const newPage = Math.max(page - 1, 1);
                setPage(newPage);
                fetchReport({ page: newPage });
              }}
              disabled={pagination.page <= 1 || loading}
              className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-300 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono text-[11px] text-zinc-300">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => {
                const newPage = Math.min(page + 1, pagination.totalPages);
                setPage(newPage);
                fetchReport({ page: newPage });
              }}
              disabled={pagination.page >= pagination.totalPages || loading}
              className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-300 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

