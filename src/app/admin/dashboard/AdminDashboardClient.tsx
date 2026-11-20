"use client";

import { useState, useTransition, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  Building2,
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  Wrench,
  Package,
  Clock,
  TrendingUp,
  BarChart3,
  RotateCw,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Flame,
  Activity,
  ChevronRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { AdminAnalyticsResult } from "@/services/analytics.service";

interface AdminDashboardClientProps {
  initialData: AdminAnalyticsResult;
  userEmail: string;
}

const emptySubscribe = () => () => {};

const PIE_COLORS = ["#F59E0B", "#06B6D4", "#10B981", "#8B5CF6"];

export default function AdminDashboardClient({
  initialData,
  userEmail,
}: AdminDashboardClientProps) {
  const [data, setData] = useState<AdminAnalyticsResult>(initialData);
  const [period, setPeriod] = useState<"7d" | "30d" | "90d" | "custom">(
    (initialData.period as "7d" | "30d" | "90d" | "custom") || "30d"
  );
  const [startDate, setStartDate] = useState(
    initialData.startDate ? initialData.startDate.slice(0, 10) : ""
  );
  const [endDate, setEndDate] = useState(
    initialData.endDate ? initialData.endDate.slice(0, 10) : ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [, startTransition] = useTransition();

  const fetchAnalytics = async (
    targetPeriod: "7d" | "30d" | "90d" | "custom",
    customStart?: string,
    customEnd?: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("period", targetPeriod);
      if (targetPeriod === "custom") {
        if (!customStart || !customEnd) {
          setError("Please select both start and end dates");
          setLoading(false);
          return;
        }
        params.set("startDate", new Date(customStart).toISOString());
        const endDateTime = new Date(customEnd);
        endDateTime.setHours(23, 59, 59, 999);
        params.set("endDate", endDateTime.toISOString());
      }

      const res = await fetch(`/api/admin/analytics?${params.toString()}`);
      const json = await res.json();
      if (!res.ok || json.status === "error") {
        throw new Error(json.message || "Failed to load analytics");
      }
      startTransition(() => {
        setData(json.data || json);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (newPeriod: "7d" | "30d" | "90d" | "custom") => {
    setPeriod(newPeriod);
    if (newPeriod !== "custom") {
      fetchAnalytics(newPeriod);
    }
  };

  const handleCustomApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      setError("Please specify both start and end dates");
      return;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      setError("End date must be after start date");
      return;
    }
    fetchAnalytics("custom", startDate, endDate);
  };

  const summary = data.summary;
  const booking = data.bookingAnalytics;
  const utilization = data.facilityUtilization;
  const equipment = data.equipmentAnalytics;
  const maintenance = data.maintenanceAnalytics;
  const recentActivity = data.recentActivity || [];

  // Prime-time pie chart data
  const primeTimePieData = [
    { name: "Prime-Time", value: booking.primeTimeCount },
    { name: "Regular Hours", value: booking.regularCount },
  ];
  const totalPrimeAndRegular = booking.primeTimeCount + booking.regularCount;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-emerald-950/40 border border-emerald-500/20 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Sports Analytics
              </span>
              <span className="text-xs text-zinc-400">• MongoDB Synchronized</span>
              <span className="text-xs text-zinc-500">
                Range: {new Date(data.startDate).toLocaleDateString("en-US")} –{" "}
                {new Date(data.endDate).toLocaleDateString("en-US")}
              </span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Admin Analytics & Facility Intelligence
            </h1>
            <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
              Comprehensive operational overview of court reservations, peak-hour utilization,
              equipment inventory balances, and preventative maintenance schedules.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="text-xs text-zinc-400 bg-zinc-900/80 px-3 py-2 rounded-xl border border-zinc-800">
              Admin: <span className="text-emerald-400 font-semibold">{userEmail}</span>
            </div>
            <button
              onClick={() => fetchAnalytics(period, startDate, endDate)}
              disabled={loading}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center gap-2 transition-all disabled:opacity-50"
              title="Refresh Analytics"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-400" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Filter Controls Toolbar */}
        <div className="mt-6 pt-6 border-t border-zinc-800/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-zinc-950/70 p-1.5 rounded-2xl border border-zinc-800 self-start">
            <button
              onClick={() => handlePeriodChange("7d")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                period === "7d"
                  ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => handlePeriodChange("30d")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                period === "30d"
                  ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => handlePeriodChange("90d")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                period === "90d"
                  ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              }`}
            >
              90 Days
            </button>
            <button
              onClick={() => handlePeriodChange("custom")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                period === "custom"
                  ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              }`}
            >
              Custom Range
            </button>
          </div>

          {period === "custom" && (
            <form
              onSubmit={handleCustomApply}
              className="flex items-center gap-2 flex-wrap bg-zinc-950/70 p-2 rounded-2xl border border-zinc-800 text-xs"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-400">From:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-zinc-900 border border-zinc-700 text-zinc-200 px-2.5 py-1 rounded-lg focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-400">To:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-zinc-900 border border-zinc-700 text-zinc-200 px-2.5 py-1 rounded-lg focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                Apply
              </button>
            </form>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* 8 Primary Summary Cards */}
      <div>
        <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">
          Key Performance Indicators
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Total Facilities */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 hover:border-zinc-700 transition-all">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Facilities</span>
              <Building2 className="w-4 h-4 text-zinc-500" />
            </div>
            <div className="mt-3 text-3xl font-extrabold text-white">{summary.totalFacilities}</div>
            <p className="text-xs text-zinc-500 mt-1">Campus athletic venues registered</p>
          </div>

          {/* 2. Active Facilities */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 hover:border-emerald-500/30 transition-all">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Facilities</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </div>
            <div className="mt-3 text-3xl font-extrabold text-emerald-400">
              {summary.activeFacilities}
            </div>
            <p className="text-xs text-emerald-400/80 mt-1">
              {summary.totalFacilities > 0
                ? `${Math.round((summary.activeFacilities / summary.totalFacilities) * 100)}% operational`
                : "None available"}
            </p>
          </div>

          {/* 3. Total Registered Students */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 hover:border-zinc-700 transition-all">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Registered Students</span>
              <Users className="w-4 h-4 text-zinc-500" />
            </div>
            <div className="mt-3 text-3xl font-extrabold text-white">{summary.totalStudents}</div>
            <p className="text-xs text-zinc-500 mt-1">Eligible student accounts</p>
          </div>

          {/* 4. Total Bookings */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 hover:border-zinc-700 transition-all">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Bookings</span>
              <Calendar className="w-4 h-4 text-zinc-500" />
            </div>
            <div className="mt-3 text-3xl font-extrabold text-white">{summary.totalBookings}</div>
            <p className="text-xs text-zinc-500 mt-1">Within selected {data.period} window</p>
          </div>

          {/* 5. Confirmed Bookings */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 hover:border-emerald-500/30 transition-all">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Confirmed Bookings</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-3 text-3xl font-extrabold text-emerald-400">
              {summary.confirmedBookings}
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              {summary.totalBookings > 0
                ? `${Math.round((summary.confirmedBookings / summary.totalBookings) * 100)}% confirmation rate`
                : "No bookings recorded"}
            </p>
          </div>

          {/* 6. Cancelled Bookings */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 hover:border-rose-500/30 transition-all">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Cancelled Bookings</span>
              <XCircle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="mt-3 text-3xl font-extrabold text-rose-400">
              {summary.cancelledBookings}
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              {summary.totalBookings > 0
                ? `${Math.round((summary.cancelledBookings / summary.totalBookings) * 100)}% cancellation rate`
                : "No cancellations"}
            </p>
          </div>

          {/* 7. Pending Maintenance */}
          <Link
            href="/admin/maintenance"
            className="bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/80 hover:border-amber-500/40 rounded-2xl p-5 transition-all group block"
          >
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-semibold uppercase tracking-wider group-hover:text-amber-400 transition-colors">
                Pending Maintenance
              </span>
              <Wrench className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
            </div>
            <div className="mt-3 text-3xl font-extrabold text-amber-400">
              {summary.pendingMaintenance}
            </div>
            <p className="text-xs text-zinc-400 mt-1 group-hover:text-amber-300 transition-colors flex items-center gap-1">
              Scheduled or In-Progress
              <ChevronRight className="w-3 h-3" />
            </p>
          </Link>

          {/* 8. Equipment Currently Issued */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 hover:border-cyan-500/30 transition-all">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Equipment Issued</span>
              <Package className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="mt-3 text-3xl font-extrabold text-cyan-400">
              {summary.equipmentCurrentlyIssued}
            </div>
            <p className="text-xs text-zinc-400 mt-1">Units currently checked out</p>
          </div>
        </div>
      </div>

      {/* Booking Analytics Charts (Trends + Prime-Time Distribution) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Booking Trends Line/Area Chart */}
        <div className="lg:col-span-2 bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Booking Trends Over Time
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Daily total, confirmed, and cancelled reservation volume
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-zinc-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Confirmed
              </span>
              <span className="flex items-center gap-1.5 text-zinc-400">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" /> Total
              </span>
              <span className="flex items-center gap-1.5 text-zinc-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" /> Cancelled
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            {mounted && booking.trends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={booking.trends}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorConfirmed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorCancelled" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                  <XAxis
                    dataKey="date"
                    stroke="var(--ink-muted)"
                    fontSize={11}
                    tickFormatter={(val) => {
                      const d = new Date(val);
                      return `${d.getMonth() + 1}/${d.getDate()}`;
                    }}
                  />
                  <YAxis stroke="var(--ink-muted)" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--surface)",
                      borderColor: "var(--line)",
                      borderRadius: "12px",
                      color: "var(--ink)",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#7C3AED"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                    name="Total Bookings"
                  />
                  <Area
                    type="monotone"
                    dataKey="confirmed"
                    stroke="#10B981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorConfirmed)"
                    name="Confirmed"
                  />
                  <Area
                    type="monotone"
                    dataKey="cancelled"
                    stroke="#F43F5E"
                    strokeWidth={1.5}
                    fillOpacity={1}
                    fill="url(#colorCancelled)"
                    name="Cancelled"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-500 text-xs">
                No booking trend data for this period
              </div>
            )}
          </div>
        </div>

        {/* Prime-Time Distribution Pie Chart */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                Prime-Time vs Regular
              </h3>
            </div>
            <p className="text-xs text-zinc-400">Peak demand allocation ratio</p>
          </div>

          <div className="h-56 w-full my-auto">
            {mounted && totalPrimeAndRegular > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={primeTimePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {primeTimePieData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                        stroke="var(--surface)"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--surface)",
                      borderColor: "var(--line)",
                      borderRadius: "12px",
                      color: "var(--ink)",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-500 text-xs">
                No prime-time split data
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-zinc-800/80 grid grid-cols-2 gap-3 text-center">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <div className="text-xs text-amber-400 font-semibold">Prime-Time</div>
              <div className="text-lg font-bold text-white">{booking.primeTimeCount}</div>
              <div className="text-[10px] text-zinc-400">
                {totalPrimeAndRegular > 0
                  ? `${Math.round((booking.primeTimeCount / totalPrimeAndRegular) * 100)}% of bookings`
                  : "0%"}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
              <div className="text-xs text-cyan-400 font-semibold">Regular Hours</div>
              <div className="text-lg font-bold text-white">{booking.regularCount}</div>
              <div className="text-[10px] text-zinc-400">
                {totalPrimeAndRegular > 0
                  ? `${Math.round((booking.regularCount / totalPrimeAndRegular) * 100)}% of bookings`
                  : "0%"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sports Popularity & Top Facilities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Sports Bar Chart */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                Most Popular Sports
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">Booking volume partitioned by sport discipline</p>
            </div>
          </div>

          <div className="h-64 w-full">
            {mounted && booking.popularSports.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={booking.popularSports}
                  margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                  <XAxis
                    dataKey="sportType"
                    stroke="var(--ink-muted)"
                    fontSize={11}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis stroke="var(--ink-muted)" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--surface)",
                      borderColor: "var(--line)",
                      borderRadius: "12px",
                      color: "var(--ink)",
                      fontSize: "12px",
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="#7C3AED"
                    radius={[6, 6, 0, 0]}
                    name="Bookings"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-500 text-xs">
                No sports popularity data available
              </div>
            )}
          </div>
        </div>

        {/* Top Booked Facilities */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-cyan-400" />
                  Top Booked Facilities
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">Venues with highest student reservation counts</p>
              </div>
            </div>

            <div className="space-y-3">
              {booking.topFacilities.length > 0 ? (
                booking.topFacilities.slice(0, 5).map((fac, idx) => (
                  <div
                    key={fac.facilityId}
                    className="flex items-center justify-between p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-300">
                        #{idx + 1}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">
                          {fac.facilityName}
                        </div>
                        <div className="text-xs text-zinc-400">{fac.sportType}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-emerald-400">{fac.count}</span>
                      <span className="text-xs text-zinc-500 ml-1">bookings</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-zinc-500 text-xs">
                  No facility reservation data available
                </div>
              )}
            </div>
          </div>
          <div className="pt-4 mt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
            <span>Ranked by reservation volume</span>
            <Link
              href="/admin/facilities"
              className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
            >
              Manage all facilities <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Facility Utilization Table */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Facility Operating Utilization
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Formula:{" "}
              <code className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded text-[11px]">
                (Confirmed Booking Hours / Available Operating Hours) × 100
              </code>{" "}
              (Excludes cancelled and rejected bookings)
            </p>
          </div>
          <span className="text-xs text-zinc-500 self-start sm:self-auto">
            {utilization.length} Active Venues Monitored
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Facility</th>
                <th className="py-3 px-4">Sport</th>
                <th className="py-3 px-4 text-right">Available Hours</th>
                <th className="py-3 px-4 text-right">Confirmed Hours</th>
                <th className="py-3 px-4 text-right">Utilization Rate</th>
                <th className="py-3 px-4 w-44">Utilization Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {utilization.length > 0 ? (
                utilization.map((item) => {
                  const pct = Math.min(100, Math.max(0, item.utilizationPercentage));
                  const barColor =
                    pct >= 70
                      ? "bg-emerald-500"
                      : pct >= 40
                      ? "bg-amber-500"
                      : "bg-cyan-500";
                  const textColor =
                    pct >= 70
                      ? "text-emerald-400"
                      : pct >= 40
                      ? "text-amber-400"
                      : "text-cyan-400";

                  return (
                    <tr key={item.facilityId} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-white">
                        {item.facilityName}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-400">{item.sportType}</td>
                      <td className="py-3.5 px-4 text-right text-zinc-300 font-mono">
                        {item.availableOperatingHours}h
                      </td>
                      <td className="py-3.5 px-4 text-right text-zinc-300 font-mono">
                        {item.confirmedHours}h
                      </td>
                      <td className={`py-3.5 px-4 text-right font-bold font-mono ${textColor}`}>
                        {item.utilizationPercentage.toFixed(1)}%
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${barColor}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-500">
                    No active facilities available for utilization analysis
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Equipment Inventory & Checkout Metrics */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-cyan-400" />
              Equipment Inventory & Circulation
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Strict inventory balance:{" "}
              <code className="text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded text-[11px]">
                Total = Available ({equipment.availableQuantity}) + Issued ({equipment.issuedQuantity}) + Damaged ({equipment.damagedQuantity})
              </code>
            </p>
          </div>
        </div>

        {/* Equipment Metric Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 text-center">
            <span className="text-[11px] text-zinc-400 uppercase font-semibold">Total Types</span>
            <div className="text-xl font-bold text-white mt-1">{equipment.totalItems}</div>
          </div>
          <div className="p-3 rounded-2xl bg-zinc-950/60 border border-emerald-500/20 text-center">
            <span className="text-[11px] text-emerald-400 uppercase font-semibold">Available</span>
            <div className="text-xl font-bold text-emerald-400 mt-1">
              {equipment.availableQuantity}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-zinc-950/60 border border-cyan-500/20 text-center">
            <span className="text-[11px] text-cyan-400 uppercase font-semibold">Issued Out</span>
            <div className="text-xl font-bold text-cyan-400 mt-1">{equipment.issuedQuantity}</div>
          </div>
          <div className="p-3 rounded-2xl bg-zinc-950/60 border border-rose-500/20 text-center">
            <span className="text-[11px] text-rose-400 uppercase font-semibold">Damaged</span>
            <div className="text-xl font-bold text-rose-400 mt-1">{equipment.damagedQuantity}</div>
          </div>
          <div className="p-3 rounded-2xl bg-zinc-950/60 border border-amber-500/20 text-center col-span-2 sm:col-span-1">
            <span className="text-[11px] text-amber-400 uppercase font-semibold">Overdue</span>
            <div className="text-xl font-bold text-amber-400 mt-1">{equipment.overdueCount}</div>
          </div>
        </div>

        {/* Most Issued Gear List */}
        <div>
          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
            Top Requested Equipment
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {equipment.mostIssuedEquipment.length > 0 ? (
              equipment.mostIssuedEquipment.map((item) => (
                <div
                  key={item.equipmentId}
                  className="p-3.5 rounded-2xl bg-zinc-950/40 border border-zinc-800/60 flex items-center justify-between"
                >
                  <div>
                    <div className="text-sm font-semibold text-white">{item.name}</div>
                    <div className="text-xs text-zinc-400">{item.category}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-cyan-400">
                      {item.checkoutCount}
                    </span>
                    <span className="text-xs text-zinc-500 ml-1">checkouts</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-6 text-center text-zinc-500 text-xs">
                No equipment checkout records found
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Maintenance Analytics & Recent Schedules */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Wrench className="w-4 h-4 text-amber-400" />
              Facility Maintenance & Preventive Care
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Impact analysis: {maintenance.facilitiesAffectedCount} facility/facilities affected by maintenance schedules
            </p>
          </div>
          <Link
            href="/admin/maintenance"
            className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 self-start transition-all"
          >
            Manage Maintenance Console <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Maintenance Status Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-zinc-950/60 border border-amber-500/20 text-center">
            <span className="text-[11px] text-amber-400 uppercase font-semibold">Scheduled</span>
            <div className="text-xl font-bold text-amber-400 mt-1">
              {maintenance.scheduledCount}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-zinc-950/60 border border-blue-500/20 text-center">
            <span className="text-[11px] text-blue-400 uppercase font-semibold">In Progress</span>
            <div className="text-xl font-bold text-blue-400 mt-1">
              {maintenance.inProgressCount}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-zinc-950/60 border border-emerald-500/20 text-center">
            <span className="text-[11px] text-emerald-400 uppercase font-semibold">Completed</span>
            <div className="text-xl font-bold text-emerald-400 mt-1">
              {maintenance.completedCount}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800 text-center">
            <span className="text-[11px] text-zinc-400 uppercase font-semibold">Cancelled</span>
            <div className="text-xl font-bold text-zinc-400 mt-1">
              {maintenance.cancelledCount}
            </div>
          </div>
        </div>

        {/* Recent Maintenance Records */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Facility</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Time Window</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {maintenance.recentMaintenance.length > 0 ? (
                maintenance.recentMaintenance.map((m) => {
                  let badge = "bg-zinc-800 text-zinc-300";
                  if (m.status === "SCHEDULED") badge = "bg-amber-500/10 text-amber-400 border border-amber-500/20";
                  if (m.status === "IN_PROGRESS") badge = "bg-blue-500/10 text-blue-400 border border-blue-500/20";
                  if (m.status === "COMPLETED") badge = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
                  if (m.status === "CANCELLED") badge = "bg-zinc-800 text-zinc-400 border border-zinc-700";

                  return (
                    <tr key={m._id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-white">
                        {m.facilityName}
                        <span className="block text-[10px] text-zinc-400">{m.sportType}</span>
                      </td>
                      <td className="py-3.5 px-4 text-zinc-300">{m.reason}</td>
                      <td className="py-3.5 px-4 text-zinc-400 font-mono text-[11px]">
                        {new Date(m.startAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        –{" "}
                        {new Date(m.endAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${badge}`}>
                          {m.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-zinc-500">
                    No recent maintenance records registered
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Chronological Recent Activity Feed */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              Recent System Activity
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Real chronological log of user reservations, equipment operations, and facility events
            </p>
          </div>
          <span className="text-xs text-zinc-500">Last 15 Events</span>
        </div>

        <div className="space-y-3">
          {recentActivity.length > 0 ? (
            recentActivity.map((act) => {
              let badgeColor = "bg-zinc-800 text-zinc-300 border-zinc-700";
              if (act.badge === "CONFIRMED") badgeColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
              if (act.badge === "CANCELLED") badgeColor = "bg-rose-500/10 text-rose-400 border-rose-500/20";
              if (act.badge === "STUDENT") badgeColor = "bg-purple-500/10 text-purple-400 border-purple-500/20";
              if (act.badge === "EQUIPMENT") badgeColor = "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
              if (act.badge === "RETURNED") badgeColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
              if (act.badge === "MAINTENANCE") badgeColor = "bg-amber-500/10 text-amber-400 border-amber-500/20";

              return (
                <div
                  key={act.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md border ${badgeColor}`}
                    >
                      {act.badge}
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-white">{act.title}</div>
                      <div className="text-[11px] text-zinc-400">{act.description}</div>
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-zinc-500 font-mono">
                    {new Date(act.timestamp).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-zinc-500 text-xs">
              No recent activity recorded yet
            </div>
          )}
        </div>
      </div>

      {/* Admin Module Navigation Hub */}
      <div>
        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">
          Administrative Modules
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/admin/facilities"
            className="p-5 rounded-2xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-emerald-500/40 transition-all group"
          >
            <Building2 className="w-5 h-5 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
              Facilities Management
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Add courts, configure operating hours, and adjust capacities.
            </p>
          </Link>

          <Link
            href="/admin/bookings"
            className="p-5 rounded-2xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-cyan-500/40 transition-all group"
          >
            <Calendar className="w-5 h-5 text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">
              Bookings & Attendance
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              View student reservations, mark check-in attendance, and log no-shows.
            </p>
          </Link>

          <Link
            href="/admin/maintenance"
            className="p-5 rounded-2xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 transition-all group"
          >
            <Wrench className="w-5 h-5 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
              Maintenance Management
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Schedule facility closures, prevent booking conflicts, and track repairs.
            </p>
          </Link>

          <Link
            href="/admin/policy"
            className="p-5 rounded-2xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-purple-500/40 transition-all group"
          >
            <ShieldAlert className="w-5 h-5 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
            <div className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">
              Fairness Policies
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Configure prime-time quota limits, cancellation windows, and penalties.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
