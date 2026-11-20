"use client";

import { useState, useTransition, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  ShieldAlert,
  UserCheck,
  UserX,
  Calendar,
  Package,
  Eye,
  AlertTriangle,
  CheckCircle2,
  X,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  History,
  ArrowUpDown,
} from "lucide-react";
import {
  SafeUserSummary,
  ListUsersResult,
  UserDetailsResult,
} from "@/services/user.service";
import { UserRole } from "@/models/User";

interface UserManagementClientProps {
  initialData: ListUsersResult;
}

export default function UserManagementClient({
  initialData,
}: UserManagementClientProps) {
  const [data, setData] = useState<ListUsersResult>(initialData);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Toast alert
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // User details modal / drawer
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetailsResult | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  // Role change modal
  const [roleModalUser, setRoleModalUser] = useState<SafeUserSummary | null>(null);
  const [targetRole, setTargetRole] = useState<UserRole>("STUDENT");
  const [roleReason, setRoleReason] = useState("");
  const [roleSubmitting, setRoleSubmitting] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);

  // Status toggle modal
  const [statusModalUser, setStatusModalUser] = useState<SafeUserSummary | null>(
    null
  );
  const [statusReason, setStatusReason] = useState("");
  const [statusSubmitting, setStatusSubmitting] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const fetchUsers = useCallback(
    async (
      overrideParams?: Partial<{
        search: string;
        role: string;
        status: string;
        sort: "desc" | "asc";
        page: number;
      }>
    ) => {
      setLoading(true);
      setError(null);

      const qSearch = overrideParams?.search !== undefined ? overrideParams.search : search;
      const qRole = overrideParams?.role !== undefined ? overrideParams.role : roleFilter;
      const qStatus = overrideParams?.status !== undefined ? overrideParams.status : statusFilter;
      const qSort = overrideParams?.sort !== undefined ? overrideParams.sort : sortOrder;
      const qPage = overrideParams?.page !== undefined ? overrideParams.page : page;

      try {
        const params = new URLSearchParams();
        if (qSearch.trim()) params.set("search", qSearch.trim());
        if (qRole !== "ALL") params.set("role", qRole);
        if (qStatus !== "ALL") params.set("status", qStatus);
        params.set("sort", qSort);
        params.set("page", String(qPage));
        params.set("limit", String(limit));

        const res = await fetch(`/api/admin/users?${params.toString()}`);
        const json = await res.json();
        if (!res.ok || json.status === "error") {
          throw new Error(json.message || "Failed to load users");
        }

        startTransition(() => {
          setData(json);
          setPage(json.page);
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load users");
      } finally {
        setLoading(false);
      }
    },
    [search, roleFilter, statusFilter, sortOrder, page, limit]
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers({ page: 1 });
  };

  const handleResetFilters = () => {
    setSearch("");
    setRoleFilter("ALL");
    setStatusFilter("ALL");
    setSortOrder("desc");
    setPage(1);
    fetchUsers({ search: "", role: "ALL", status: "ALL", sort: "desc", page: 1 });
  };

  const openUserDetails = async (userId: string) => {
    setSelectedUserId(userId);
    setDetailsLoading(true);
    setDetailsError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`);
      const json = await res.json();
      if (!res.ok || json.status === "error") {
        throw new Error(json.message || "Failed to load user details");
      }
      setUserDetails(json);
    } catch (err) {
      setDetailsError(
        err instanceof Error ? err.message : "Failed to load user details"
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleModalUser) return;
    setRoleSubmitting(true);
    setRoleError(null);

    try {
      const res = await fetch(`/api/admin/users/${roleModalUser._id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: targetRole, reason: roleReason }),
      });
      const json = await res.json();
      if (!res.ok || json.status === "error") {
        throw new Error(json.message || "Failed to update user role");
      }

      setToast({
        type: "success",
        message: `${roleModalUser.name}'s role updated to ${targetRole}`,
      });
      setRoleModalUser(null);
      setRoleReason("");
      fetchUsers();

      // If details drawer is open for this user, refresh it
      if (selectedUserId === roleModalUser._id) {
        openUserDetails(roleModalUser._id);
      }
    } catch (err) {
      setRoleError(
        err instanceof Error ? err.message : "Failed to update user role"
      );
    } finally {
      setRoleSubmitting(false);
    }
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusModalUser) return;
    setStatusSubmitting(true);
    setStatusError(null);

    const nextStatus = !statusModalUser.isActive;

    try {
      const res = await fetch(`/api/admin/users/${statusModalUser._id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextStatus, reason: statusReason }),
      });
      const json = await res.json();
      if (!res.ok || json.status === "error") {
        throw new Error(json.message || "Failed to update account status");
      }

      setToast({
        type: "success",
        message: `${statusModalUser.name}'s account is now ${
          nextStatus ? "active" : "deactivated"
        }`,
      });
      setStatusModalUser(null);
      setStatusReason("");
      fetchUsers();

      // If details drawer is open for this user, refresh it
      if (selectedUserId === statusModalUser._id) {
        openUserDetails(statusModalUser._id);
      }
    } catch (err) {
      setStatusError(
        err instanceof Error ? err.message : "Failed to update account status"
      );
    } finally {
      setStatusSubmitting(false);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case "ADMIN":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "EQUIPMENT_MANAGER":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/30";
      case "TEACHER":
        return "bg-purple-500/10 text-purple-400 border-purple-500/30";
      default:
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between text-xs animate-in fade-in duration-200 ${
            toast.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-rose-500/10 border-rose-500/30 text-rose-400"
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span className="font-semibold">{toast.message}</span>
          </div>
          <button
            onClick={() => setToast(null)}
            className="p-1 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-amber-950/40 border border-amber-500/20 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                User Directory & Access Control
              </span>
              <span className="text-xs text-zinc-400">• Role Governance</span>
              <span className="text-xs text-zinc-500">Total: {data.total} registered</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              User Management
            </h1>
            <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
              Inspect user accounts, manage platform permissions, update operational roles,
              and enforce access governance with audit logging.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchUsers()}
              disabled={loading}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center gap-2 transition-all disabled:opacity-50"
              title="Refresh User List"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-400" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="mt-6 pt-6 border-t border-zinc-800/80 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <form
            onSubmit={handleSearchSubmit}
            className="flex-1 relative flex items-center"
          >
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-950/80 border border-zinc-800 text-zinc-200 pl-10 pr-24 py-2 rounded-2xl text-xs focus:outline-none focus:border-amber-500/50"
            />
            <button
              type="submit"
              className="absolute right-1.5 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl transition-colors"
            >
              Search
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Role Filter */}
            <div className="flex items-center gap-1.5 bg-zinc-950/80 px-3 py-1.5 rounded-2xl border border-zinc-800">
              <span className="text-zinc-500">Role:</span>
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(1);
                  fetchUsers({ role: e.target.value, page: 1 });
                }}
                className="bg-transparent text-zinc-200 focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-zinc-900 text-zinc-200">All Roles</option>
                <option value="STUDENT" className="bg-zinc-900 text-zinc-200">Students</option>
                <option value="TEACHER" className="bg-zinc-900 text-zinc-200">Teachers / Faculty</option>
                <option value="ADMIN" className="bg-zinc-900 text-zinc-200">Admins</option>
                <option value="EQUIPMENT_MANAGER" className="bg-zinc-900 text-zinc-200">
                  Equipment Managers
                </option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 bg-zinc-950/80 px-3 py-1.5 rounded-2xl border border-zinc-800">
              <span className="text-zinc-500">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                  fetchUsers({ status: e.target.value, page: 1 });
                }}
                className="bg-transparent text-zinc-200 focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-zinc-900 text-zinc-200">All Status</option>
                <option value="ACTIVE" className="bg-zinc-900 text-zinc-200">Active</option>
                <option value="INACTIVE" className="bg-zinc-900 text-zinc-200">Inactive</option>
              </select>
            </div>

            {/* Sort Order */}
            <button
              onClick={() => {
                const nextSort = sortOrder === "desc" ? "asc" : "desc";
                setSortOrder(nextSort);
                fetchUsers({ sort: nextSort });
              }}
              className="px-3 py-1.5 bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 rounded-2xl text-zinc-300 flex items-center gap-1.5 transition-colors"
              title="Toggle Sort Order"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
              <span>{sortOrder === "desc" ? "Newest First" : "Oldest First"}</span>
            </button>

            {(search || roleFilter !== "ALL" || statusFilter !== "ALL" || sortOrder !== "desc") && (
              <button
                onClick={handleResetFilters}
                className="px-3 py-1.5 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 rounded-2xl transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchUsers()}
            className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 rounded-lg text-rose-300 font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {/* User Table */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-400 font-semibold uppercase tracking-wider">
                <th className="py-4 px-5">User</th>
                <th className="py-4 px-4">Contact</th>
                <th className="py-4 px-4">Role</th>
                <th className="py-4 px-4">Account Status</th>
                <th className="py-4 px-4 text-center">Bookings</th>
                <th className="py-4 px-4">Registered Date</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {loading ? (
                // Loading Skeleton Rows
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skeleton-${i}`} className="animate-pulse">
                    <td className="py-4 px-5">
                      <div className="h-4 bg-zinc-800 rounded w-32 mb-1.5" />
                      <div className="h-3 bg-zinc-800/60 rounded w-44" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-3 bg-zinc-800 rounded w-24" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-5 bg-zinc-800 rounded-full w-20" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-5 bg-zinc-800 rounded-full w-16" />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="h-4 bg-zinc-800 rounded w-8 mx-auto" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-3 bg-zinc-800 rounded w-28" />
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="h-7 bg-zinc-800 rounded-xl w-24 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : data.users.length > 0 ? (
                data.users.map((u) => (
                  <tr
                    key={u._id}
                    className="hover:bg-zinc-800/30 transition-colors group"
                  >
                    <td className="py-4 px-5">
                      <div className="font-semibold text-white group-hover:text-amber-400 transition-colors">
                        {u.name}
                      </div>
                      <div className="text-zinc-400 text-[11px] font-mono">{u.email}</div>
                    </td>
                    <td className="py-4 px-4 text-zinc-300">
                      {u.phoneNumber ? (
                        <span className="flex items-center gap-1.5 text-zinc-300">
                          <Phone className="w-3 h-3 text-zinc-500" />
                          {u.phoneNumber}
                        </span>
                      ) : (
                        <span className="text-zinc-500 italic">None</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${getRoleBadge(
                          u.role
                        )}`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {u.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center font-mono font-bold text-zinc-200">
                      {u.bookingCount}
                    </td>
                    <td className="py-4 px-4 text-zinc-400 text-[11px]">
                      {u.createdAt
                        ? new Date(u.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "N/A"}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openUserDetails(u._id)}
                          className="px-2.5 py-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors flex items-center gap-1"
                          title="View Profile & History"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Details</span>
                        </button>
                        <button
                          onClick={() => {
                            setRoleModalUser(u);
                            setTargetRole(u.role);
                            setRoleReason("");
                            setRoleError(null);
                          }}
                          className="px-2.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-colors"
                          title="Change Role"
                        >
                          Role
                        </button>
                        <button
                          onClick={() => {
                            setStatusModalUser(u);
                            setStatusReason("");
                            setStatusError(null);
                          }}
                          className={`px-2.5 py-1 rounded-xl border transition-colors ${
                            u.isActive
                              ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30"
                              : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                          }`}
                          title={u.isActive ? "Deactivate Account" : "Activate Account"}
                        >
                          {u.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500">
                    <div className="flex flex-col items-center justify-center">
                      <Users className="w-8 h-8 text-zinc-600 mb-2" />
                      <span className="text-sm font-semibold text-zinc-400">
                        No users found matching your filters
                      </span>
                      <p className="text-xs text-zinc-500 mt-1">
                        Try adjusting your search criteria or resetting filters.
                      </p>
                      <button
                        onClick={handleResetFilters}
                        className="mt-3 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs rounded-xl font-semibold transition-colors"
                      >
                        Clear Filters
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-900/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
          <div>
            Showing{" "}
            <span className="text-white font-semibold">
              {data.users.length > 0 ? (page - 1) * limit + 1 : 0}
            </span>{" "}
            to{" "}
            <span className="text-white font-semibold">
              {Math.min(page * limit, data.total)}
            </span>{" "}
            of <span className="text-white font-semibold">{data.total}</span> users
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (page > 1) {
                  const prev = page - 1;
                  setPage(prev);
                  fetchUsers({ page: prev });
                }
              }}
              disabled={page <= 1 || loading}
              className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:hover:bg-zinc-800 text-zinc-300 transition-colors"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-zinc-300 font-semibold">
              Page {data.page} of {data.totalPages}
            </span>
            <button
              onClick={() => {
                if (page < data.totalPages) {
                  const next = page + 1;
                  setPage(next);
                  fetchUsers({ page: next });
                }
              }}
              disabled={page >= data.totalPages || loading}
              className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:hover:bg-zinc-800 text-zinc-300 transition-colors"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* User Details Slide-over / Modal */}
      {selectedUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => {
                setSelectedUserId(null);
                setUserDetails(null);
              }}
              className="absolute top-5 right-5 p-1.5 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {detailsLoading ? (
              <div className="py-16 text-center text-zinc-400 text-xs flex flex-col items-center justify-center gap-2">
                <RotateCw className="w-6 h-6 animate-spin text-amber-400" />
                <span>Loading user dossier...</span>
              </div>
            ) : detailsError ? (
              <div className="py-8 text-center text-rose-400 text-xs">
                <AlertTriangle className="w-6 h-6 mx-auto mb-2" />
                <span>{detailsError}</span>
              </div>
            ) : userDetails ? (
              <div className="space-y-6">
                {/* Profile Header */}
                <div className="flex items-start justify-between border-b border-zinc-800 pb-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold text-white">
                        {userDetails.user.name}
                      </h2>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getRoleBadge(
                          userDetails.user.role
                        )}`}
                      >
                        {userDetails.user.role}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-400 mt-1 flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1 font-mono">
                        <Mail className="w-3 h-3 text-zinc-500" />
                        {userDetails.user.email}
                      </span>
                      {userDetails.user.phoneNumber && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-zinc-500" />
                          {userDetails.user.phoneNumber}
                        </span>
                      )}
                      <span>
                        Joined:{" "}
                        {new Date(userDetails.user.createdAt).toLocaleDateString("en-US")}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    {userDetails.user.isActive ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        Active Account
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                        Inactive / Suspended
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 text-center">
                    <span className="text-[11px] text-zinc-400 uppercase font-semibold">
                      Total Bookings
                    </span>
                    <div className="text-2xl font-bold text-white mt-1">
                      {userDetails.stats.totalBookings}
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 text-center">
                    <span className="text-[11px] text-zinc-400 uppercase font-semibold">
                      Equipment Checkouts
                    </span>
                    <div className="text-2xl font-bold text-cyan-400 mt-1">
                      {userDetails.stats.totalCheckouts}
                    </div>
                  </div>
                </div>

                {/* Recent Bookings History */}
                <div>
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                    Recent Facility Reservations
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {userDetails.recentBookings.length > 0 ? (
                      userDetails.recentBookings.map((b) => (
                        <div
                          key={b._id}
                          className="p-2.5 rounded-xl bg-zinc-950/40 border border-zinc-800/60 flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-semibold text-white">
                              {b.facilityName}{" "}
                              <span className="text-zinc-500 font-normal">
                                ({b.sportType})
                              </span>
                            </div>
                            <div className="text-[11px] text-zinc-400 font-mono">
                              {new Date(b.startAt).toLocaleString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                              b.status === "CONFIRMED"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : b.status === "CANCELLED"
                                ? "bg-rose-500/10 text-rose-400"
                                : "bg-zinc-800 text-zinc-300"
                            }`}
                          >
                            {b.status}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="py-4 text-center text-zinc-500 text-xs">
                        No reservation history found
                      </div>
                    )}
                  </div>
                </div>

                {/* Equipment Checkouts */}
                <div>
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-cyan-400" />
                    Equipment Checkouts
                  </h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {userDetails.recentCheckouts.length > 0 ? (
                      userDetails.recentCheckouts.map((c) => (
                        <div
                          key={c._id}
                          className="p-2.5 rounded-xl bg-zinc-950/40 border border-zinc-800/60 flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-semibold text-white">
                              {c.equipmentNames}
                            </div>
                            <div className="text-[11px] text-zinc-400 font-mono">
                              Expected Return:{" "}
                              {new Date(c.expectedReturnAt).toLocaleDateString("en-US")}
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-zinc-800 text-zinc-300">
                            {c.status}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="py-4 text-center text-zinc-500 text-xs">
                        No equipment checkouts recorded
                      </div>
                    )}
                  </div>
                </div>

                {/* Administrative Audit History */}
                <div>
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-amber-400" />
                    Security & Administrative Audit Log
                  </h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {userDetails.auditHistory.length > 0 ? (
                      userDetails.auditHistory.map((a) => (
                        <div
                          key={a._id}
                          className="p-2.5 rounded-xl bg-zinc-950/40 border border-zinc-800/60 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-white">
                              {a.actionType === "ROLE_CHANGE"
                                ? "Role Changed"
                                : "Status Changed"}
                              :{" "}
                              <span className="text-amber-400 font-mono">
                                {a.previousValue} → {a.newValue}
                              </span>
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              {new Date(a.createdAt).toLocaleDateString("en-US")}
                            </span>
                          </div>
                          <div className="text-[11px] text-zinc-400 mt-0.5">
                            By {a.adminName} ({a.adminEmail})
                            {a.reason && ` • Reason: "${a.reason}"`}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-4 text-center text-zinc-500 text-xs">
                        No administrative modifications recorded for this user
                      </div>
                    )}
                  </div>
                </div>

                {/* Standalone Link */}
                <div className="pt-3 border-t border-zinc-800 flex justify-between items-center text-xs">
                  <Link
                    href={`/admin/users/${userDetails.user._id}`}
                    className="text-amber-400 hover:text-amber-300 font-semibold"
                  >
                    Open Full Dossier Page →
                  </Link>
                  <button
                    onClick={() => {
                      setSelectedUserId(null);
                      setUserDetails(null);
                    }}
                    className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Role Change Modal */}
      {roleModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setRoleModalUser(null)}
              className="absolute top-5 right-5 p-1 rounded-lg text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Modify User Role</h3>
                <p className="text-xs text-zinc-400">Target: {roleModalUser.name}</p>
              </div>
            </div>

            {roleError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{roleError}</span>
              </div>
            )}

            <form onSubmit={handleRoleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1 font-semibold">
                  Select New Role
                </label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value as UserRole)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 px-3 py-2 rounded-xl focus:outline-none focus:border-amber-500"
                >
                  <option value="STUDENT">STUDENT - Standard student access</option>
                  <option value="TEACHER">TEACHER - Faculty / Instructor</option>
                  <option value="EQUIPMENT_MANAGER">
                    EQUIPMENT_MANAGER - Equipment inventory & checkouts
                  </option>
                  <option value="ADMIN">ADMIN - Full system administrator</option>
                </select>
              </div>

              {roleModalUser.role === "ADMIN" && targetRole !== "ADMIN" && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Warning: Demoting an Administrator account. The system prevents
                    demoting the sole active administrator to avoid administrative lockout.
                  </span>
                </div>
              )}

              <div>
                <label className="block text-zinc-400 mb-1 font-semibold">
                  Reason for Role Change (Optional)
                </label>
                <textarea
                  value={roleReason}
                  onChange={(e) => setRoleReason(e.target.value)}
                  placeholder="e.g. Promoted to student coordinator..."
                  rows={2}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 px-3 py-2 rounded-xl focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRoleModalUser(null)}
                  disabled={roleSubmitting}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={roleSubmitting || targetRole === roleModalUser.role}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-bold transition-colors"
                >
                  {roleSubmitting ? "Updating..." : "Confirm Role Change"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Account Status Toggle Modal */}
      {statusModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setStatusModalUser(null)}
              className="absolute top-5 right-5 p-1 rounded-lg text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  statusModalUser.isActive
                    ? "bg-rose-500/10 border border-rose-500/30 text-rose-400"
                    : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                }`}
              >
                {statusModalUser.isActive ? (
                  <UserX className="w-5 h-5" />
                ) : (
                  <UserCheck className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {statusModalUser.isActive ? "Deactivate Account" : "Activate Account"}
                </h3>
                <p className="text-xs text-zinc-400">Target: {statusModalUser.name}</p>
              </div>
            </div>

            {statusError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{statusError}</span>
              </div>
            )}

            <form onSubmit={handleStatusSubmit} className="space-y-4 text-xs">
              <p className="text-zinc-300">
                {statusModalUser.isActive ? (
                  <span>
                    Deactivating this account will prevent the user from logging in,
                    booking sports courts, or checking out equipment. All past booking
                    and checkout history is strictly preserved.
                  </span>
                ) : (
                  <span>
                    Reactivating this account will restore the user&apos;s ability to
                    log in and make new court bookings and equipment requests.
                  </span>
                )}
              </p>

              {statusModalUser.role === "ADMIN" && statusModalUser.isActive && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Attention: Deactivating an Administrator account. The system prevents
                    deactivating the sole active administrator account.
                  </span>
                </div>
              )}

              <div>
                <label className="block text-zinc-400 mb-1 font-semibold">
                  Reason for Action (Optional)
                </label>
                <textarea
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="e.g. Inactivity policy, account review..."
                  rows={2}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 px-3 py-2 rounded-xl focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStatusModalUser(null)}
                  disabled={statusSubmitting}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={statusSubmitting}
                  className={`px-4 py-2 rounded-xl font-bold transition-colors ${
                    statusModalUser.isActive
                      ? "bg-rose-500 hover:bg-rose-400 text-white"
                      : "bg-emerald-500 hover:bg-emerald-400 text-zinc-950"
                  }`}
                >
                  {statusSubmitting
                    ? "Updating..."
                    : statusModalUser.isActive
                    ? "Confirm Deactivation"
                    : "Confirm Activation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
