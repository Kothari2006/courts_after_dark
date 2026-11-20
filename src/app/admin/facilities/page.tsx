"use client";

import { useEffect, useState, useCallback } from "react";
import Navbar from "@/components/Navbar";
import {
  Building2,
  Plus,
  Search,
  Filter,
  Edit2,
  PowerOff,
  RefreshCw,
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Users,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FacilityData {
  _id: string;
  name: string;
  description: string;
  sportType: string;
  location: string;
  capacity: number;
  status: "ACTIVE" | "INACTIVE" | "MAINTENANCE";
  operatingHours: { open: string; close: string };
  slotDuration: number;
  timezone: string;
  images?: string[];
  createdAt?: string;
}

interface FormState {
  name: string;
  description: string;
  sportType: string;
  location: string;
  capacity: number;
  status: "ACTIVE" | "INACTIVE" | "MAINTENANCE";
  openTime: string;
  closeTime: string;
  slotDuration: number;
  timezone: string;
  imageUrl: string;
}

const defaultForm: FormState = {
  name: "",
  description: "",
  sportType: "BADMINTON",
  location: "",
  capacity: 4,
  status: "ACTIVE",
  openTime: "06:00",
  closeTime: "23:00",
  slotDuration: 60,
  timezone: "Asia/Kolkata",
  imageUrl: "",
};

const SPORT_OPTIONS = [
  "BADMINTON",
  "BASKETBALL",
  "FOOTBALL",
  "CRICKET",
  "TENNIS",
  "GYM",
  "OTHER",
];

export default function AdminFacilitiesPage() {
  const [facilities, setFacilities] = useState<FacilityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Notifications
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modal Form State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchFacilities = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      params.set("limit", "50");

      const res = await fetch(`/api/facilities?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to load facilities");
      }

      setFacilities(data.data || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error fetching facilities";
      setNotice({ type: "error", message: msg });
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFacilities();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchFacilities]);

  const openCreateModal = () => {
    setEditingId(null);
    setForm(defaultForm);
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (facility: FacilityData) => {
    setEditingId(facility._id);
    setForm({
      name: facility.name,
      description: facility.description,
      sportType: facility.sportType,
      location: facility.location,
      capacity: facility.capacity,
      status: facility.status,
      openTime: facility.operatingHours?.open || "06:00",
      closeTime: facility.operatingHours?.close || "23:00",
      slotDuration: facility.slotDuration || 60,
      timezone: facility.timezone || "Asia/Kolkata",
      imageUrl: facility.images?.[0] || "",
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        sportType: form.sportType,
        location: form.location.trim(),
        capacity: Number(form.capacity),
        status: form.status,
        operatingHours: {
          open: form.openTime.trim(),
          close: form.closeTime.trim(),
        },
        slotDuration: Number(form.slotDuration),
        timezone: form.timezone.trim(),
        images: form.imageUrl.trim() ? [form.imageUrl.trim()] : [],
      };

      const url = editingId ? `/api/facilities/${editingId}` : "/api/facilities";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to save facility");
      }

      setNotice({
        type: "success",
        message: editingId
          ? `Facility "${form.name}" updated successfully`
          : `Facility "${form.name}" created successfully`,
      });

      setModalOpen(false);
      fetchFacilities();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to process form";
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to deactivate "${name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/facilities/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Deactivation failed");
      }

      setNotice({
        type: "success",
        message: data.message || `Facility "${name}" deactivated successfully`,
      });
      fetchFacilities();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error during deactivation";
      setNotice({ type: "error", message: msg });
    }
  };

  const handleStatusChange = async (id: string, newStatus: "ACTIVE" | "MAINTENANCE" | "INACTIVE") => {
    try {
      const res = await fetch(`/api/facilities/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Status update failed");
      }

      setNotice({
        type: "success",
        message: `Status updated to ${newStatus}`,
      });
      fetchFacilities();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Status update failed";
      setNotice({ type: "error", message: msg });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header Console */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-0.5 text-xs font-bold text-amber-400 mb-2">
              <Building2 className="h-3.5 w-3.5" /> Administrator Facilities Console
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Facilities Management
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Add new sports venues, configure operating hours, adjust capacity, and toggle operational status.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition-colors shadow-lg shadow-amber-500/20"
            >
              <Plus className="h-4 w-4" /> Add New Facility
            </button>
          </div>
        </div>

        {/* Global Notifications */}
        {notice && (
          <div
            className={cn(
              "p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between",
              notice.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-rose-500/10 border-rose-500/30 text-rose-400"
            )}
          >
            <div className="flex items-center gap-2">
              {notice.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              <span>{notice.message}</span>
            </div>
            <button
              onClick={() => setNotice(null)}
              className="text-xs opacity-70 hover:opacity-100 p-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search facility name, location..."
              className="w-full px-4 py-2.5 pl-10 rounded-xl bg-zinc-900 border border-zinc-800 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 transition-colors"
            />
            <Search className="h-4 w-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-zinc-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300 focus:outline-none focus:border-amber-400"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="MAINTENANCE">Maintenance Only</option>
              <option value="INACTIVE">Inactive / Deactivated</option>
            </select>

            <button
              onClick={() => fetchFacilities()}
              disabled={loading}
              title="Refresh"
              className="p-2 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition-colors"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin text-amber-400")} />
            </button>
          </div>
        </div>

        {/* Facilities Table / List */}
        {loading ? (
          <div className="p-12 text-center text-xs text-zinc-400">Loading facilities...</div>
        ) : facilities.length === 0 ? (
          <div className="p-12 text-center rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/40">
            <p className="text-sm font-bold text-zinc-300">No facilities found</p>
            <p className="text-xs text-zinc-500 mt-1">Create your first facility or adjust your search filters.</p>
            <button
              onClick={openCreateModal}
              className="mt-4 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs"
            >
              Add First Facility
            </button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-900/90 border-b border-zinc-800 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  <tr>
                    <th className="px-5 py-3.5">Facility Name</th>
                    <th className="px-4 py-3.5">Sport</th>
                    <th className="px-4 py-3.5">Location</th>
                    <th className="px-4 py-3.5">Capacity</th>
                    <th className="px-4 py-3.5">Operating Hours</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80">
                  {facilities.map((f) => (
                    <tr key={f._id} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="px-5 py-4 font-bold text-white max-w-xs">
                        <div className="truncate">{f.name}</div>
                        <div className="text-[11px] text-zinc-500 truncate font-normal mt-0.5">
                          {f.description}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                          {f.sportType}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-zinc-300">
                        <div className="flex items-center gap-1.5 truncate max-w-[180px]">
                          <MapPin className="h-3 w-3 text-zinc-500 shrink-0" />
                          <span className="truncate">{f.location}</span>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-zinc-300">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3 text-zinc-500" />
                          <span>{f.capacity}</span>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-zinc-300 font-mono text-[11px]">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-zinc-500" />
                          <span>
                            {f.operatingHours?.open} - {f.operatingHours?.close} ({f.slotDuration}m)
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <select
                          value={f.status}
                          onChange={(e) => handleStatusChange(f._id, e.target.value as "ACTIVE" | "MAINTENANCE" | "INACTIVE")}
                          className={cn(
                            "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg border bg-zinc-950 focus:outline-none",
                            f.status === "ACTIVE" && "text-emerald-400 border-emerald-500/30",
                            f.status === "MAINTENANCE" && "text-amber-400 border-amber-500/30",
                            f.status === "INACTIVE" && "text-rose-400 border-rose-500/30"
                          )}
                        >
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="MAINTENANCE">MAINTENANCE</option>
                          <option value="INACTIVE">INACTIVE</option>
                        </select>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(f)}
                            className="p-1.5 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors"
                            title="Edit Facility"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeactivate(f._id, f.name)}
                            disabled={f.status === "INACTIVE"}
                            className="p-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Deactivate Facility"
                          >
                            <PowerOff className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Modal: Add / Edit Facility */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl border border-zinc-800 bg-[var(--surface)] p-6 sm:p-8 shadow-2xl relative my-8">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-xl font-black text-white mb-1">
              {editingId ? "Edit Facility" : "Add New Sports Facility"}
            </h2>
            <p className="text-xs text-zinc-400 mb-6">
              Configure venue specifications, operating time windows, and player capacity.
            </p>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Facility Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Facility Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. North Arena - Court 1"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Sport Type */}
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Sport Category *
                  </label>
                  <select
                    value={form.sportType}
                    onChange={(e) => setForm({ ...form, sportType: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400"
                  >
                    {SPORT_OPTIONS.map((sport) => (
                      <option key={sport} value={sport}>
                        {sport}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Operational Status *
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as "ACTIVE" | "MAINTENANCE" | "INACTIVE" })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="MAINTENANCE">MAINTENANCE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>

                {/* Location */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Campus Location *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="e.g. North Sports Dome, Ground Floor"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Capacity */}
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Max Player Capacity *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    required
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Slot Duration */}
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Slot Duration (Minutes) *
                  </label>
                  <input
                    type="number"
                    min={15}
                    max={240}
                    step={15}
                    required
                    value={form.slotDuration}
                    onChange={(e) => setForm({ ...form, slotDuration: parseInt(e.target.value, 10) || 60 })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Operating Hours: Open */}
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Opening Time (HH:mm 24h) *
                  </label>
                  <input
                    type="text"
                    required
                    pattern="^([01]\d|2[0-3]):[0-5]\d$"
                    value={form.openTime}
                    onChange={(e) => setForm({ ...form, openTime: e.target.value })}
                    placeholder="06:00"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Operating Hours: Close */}
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Closing Time (HH:mm 24h) *
                  </label>
                  <input
                    type="text"
                    required
                    pattern="^([01]\d|2[0-3]):[0-5]\d$"
                    value={form.closeTime}
                    onChange={(e) => setForm({ ...form, closeTime: e.target.value })}
                    placeholder="23:00"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Timezone */}
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Timezone
                  </label>
                  <input
                    type="text"
                    value={form.timezone}
                    onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                    placeholder="Asia/Kolkata"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Image URL */}
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={form.imageUrl}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    placeholder="https://example.com/court.jpg"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Description */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Description *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Provide details about the court flooring, lighting, amenities, and equipment availability..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {submitting
                    ? "Saving..."
                    : editingId
                    ? "Update Facility"
                    : "Create Facility"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
