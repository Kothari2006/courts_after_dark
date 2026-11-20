"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  AlertCircle,
  Loader2,
  X,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EquipmentRecord {
  _id: string;
  name: string;
  category: string;
  description?: string;
  totalQuantity: number;
  availableQuantity: number;
  damagedQuantity: number;
  status: "AVAILABLE" | "UNAVAILABLE";
  createdAt: string;
}

const CATEGORIES = [
  "ALL",
  "BADMINTON",
  "BASKETBALL",
  "FOOTBALL",
  "CRICKET",
  "TENNIS",
  "GYM",
  "OTHER",
];

export default function EquipmentManagerInventoryPage() {
  const [items, setItems] = useState<EquipmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Add Item Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("BADMINTON");
  const [newDescription, setNewDescription] = useState("");
  const [newTotalQuantity, setNewTotalQuantity] = useState(10);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Edit Stock Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EquipmentRecord | null>(null);
  const [editTotal, setEditTotal] = useState(0);
  const [editAvailable, setEditAvailable] = useState(0);
  const [editDamaged, setEditDamaged] = useState(0);
  const [editStatus, setEditStatus] = useState<"AVAILABLE" | "UNAVAILABLE">("AVAILABLE");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function fetchInventory() {
      try {
        setLoading(true);
        setError(null);
        const queryParams = new URLSearchParams();
        if (selectedCategory !== "ALL") queryParams.set("category", selectedCategory);
        if (searchQuery.trim()) queryParams.set("search", searchQuery.trim());
        queryParams.set("limit", "100");

        const res = await fetch(`/api/equipment?${queryParams.toString()}`);
        if (!res.ok) throw new Error("Failed to load inventory");
        const data = await res.json();
        if (isMounted) {
          setItems(data.equipment || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Error loading inventory");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchInventory();

    return () => {
      isMounted = false;
    };
  }, [selectedCategory, searchQuery, refreshTrigger]);

  const handleCreateEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setAddLoading(true);
      setAddError(null);

      const res = await fetch("/api/equipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          category: newCategory,
          description: newDescription.trim() || undefined,
          totalQuantity: Number(newTotalQuantity),
          status: "AVAILABLE",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to add equipment");

      setAddModalOpen(false);
      setNewName("");
      setNewDescription("");
      setNewTotalQuantity(10);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Failed to add equipment");
    } finally {
      setAddLoading(false);
    }
  };

  const openEditModal = (item: EquipmentRecord) => {
    setEditingItem(item);
    setEditTotal(item.totalQuantity);
    setEditAvailable(item.availableQuantity);
    setEditDamaged(item.damagedQuantity);
    setEditStatus(item.status);
    setEditError(null);
    setEditModalOpen(true);
  };

  const handleUpdateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    if (editAvailable + editDamaged > editTotal) {
      setEditError("Available + Damaged quantity cannot exceed Total quantity");
      return;
    }

    try {
      setEditLoading(true);
      setEditError(null);

      const res = await fetch(`/api/equipment/${editingItem._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalQuantity: Number(editTotal),
          availableQuantity: Number(editAvailable),
          damagedQuantity: Number(editDamaged),
          status: editStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update equipment");

      setEditModalOpen(false);
      setEditingItem(null);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Failed to update equipment");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm("Are you sure you want to toggle status for this equipment item?")) return;
    try {
      const res = await fetch(`/api/equipment/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to deactivate");
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error deactivating");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/equipment-manager/dashboard"
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-cyan-400 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Desk Control Panel
          </Link>

          <button
            onClick={() => setAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-xs rounded-xl transition-colors shadow-lg shadow-cyan-500/20 cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Add New Equipment
          </button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-black text-white tracking-tight">
            Inventory Catalog & Stock Audit
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Maintain accurate records of total units, available gear for checkout, and damaged stock.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search equipment by name or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <Filter className="h-4 w-4 text-zinc-500 shrink-0 hidden sm:block" />
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors",
                  selectedCategory === cat
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
                    : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Inventory Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16 text-zinc-500">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-400 mb-3" />
            <p className="text-sm">Loading inventory items...</p>
          </div>
        ) : error ? (
          <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : items.length === 0 ? (
          <div className="p-16 border border-dashed border-zinc-800 rounded-3xl text-center text-zinc-500">
            <Package className="h-10 w-10 mx-auto mb-3 opacity-40 text-cyan-400" />
            <p className="text-sm font-semibold text-zinc-300">No equipment items found</p>
            <p className="text-xs text-zinc-500 mt-1">Try adjusting your filters or register a new item.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/40 shadow-xl">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-900 uppercase tracking-wider text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="px-5 py-3.5">Item Name</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5 text-center">Total</th>
                  <th className="px-5 py-3.5 text-center">Available</th>
                  <th className="px-5 py-3.5 text-center">Issued</th>
                  <th className="px-5 py-3.5 text-center">Damaged</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {items.map((item) => {
                  const issued = Math.max(
                    0,
                    item.totalQuantity - item.availableQuantity - item.damagedQuantity
                  );
                  return (
                    <tr key={item._id} className="hover:bg-zinc-900/60 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-white text-sm">{item.name}</div>
                        {item.description && (
                          <div className="text-[11px] text-zinc-500 truncate max-w-xs">
                            {item.description}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-300">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center font-bold text-white">
                        {item.totalQuantity}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span
                          className={cn(
                            "font-bold",
                            item.availableQuantity > 0 ? "text-emerald-400" : "text-rose-400"
                          )}
                        >
                          {item.availableQuantity}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center font-bold text-cyan-400">
                        {issued}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span
                          className={cn(
                            "font-bold",
                            item.damagedQuantity > 0 ? "text-amber-400" : "text-zinc-500"
                          )}
                        >
                          {item.damagedQuantity}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold",
                            item.status === "AVAILABLE"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          )}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                            title="Edit Stock / Adjust Quantities"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeactivate(item._id)}
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-950 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Toggle Availability"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Add Equipment Modal */}
        {addModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl relative">
              <button
                onClick={() => setAddModalOpen(false)}
                className="absolute top-5 right-5 text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

              <h3 className="text-xl font-black text-white mb-1">Add New Equipment</h3>
              <p className="text-xs text-zinc-400 mb-5">
                Register a new sports gear item in the inventory catalog.
              </p>

              <form onSubmit={handleCreateEquipment} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Equipment Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Yonex Nanoray 10F Racket"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full rounded-xl bg-zinc-950 border border-zinc-700 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Sport Category *
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full rounded-xl bg-zinc-950 border border-zinc-700 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    {CATEGORIES.filter((c) => c !== "ALL").map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Total Starting Quantity *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={newTotalQuantity}
                    onChange={(e) => setNewTotalQuantity(parseInt(e.target.value) || 1)}
                    className="w-full rounded-xl bg-zinc-950 border border-zinc-700 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Description / Specifications
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Details about brand, size, or material..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full rounded-xl bg-zinc-950 border border-zinc-700 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {addError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                    {addError}
                  </div>
                )}

                <div className="pt-3 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setAddModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addLoading}
                    className="px-5 py-2 text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-zinc-950 rounded-xl disabled:opacity-50 transition-colors shadow-lg shadow-cyan-500/20 flex items-center gap-2"
                  >
                    {addLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Item"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Stock Modal */}
        {editModalOpen && editingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl relative">
              <button
                onClick={() => setEditModalOpen(false)}
                className="absolute top-5 right-5 text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

              <h3 className="text-xl font-black text-white mb-1">
                Edit Stock: {editingItem.name}
              </h3>
              <p className="text-xs text-zinc-400 mb-5">
                Adjust unit counts and inventory status.
              </p>

              <form onSubmit={handleUpdateStock} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Total Quantity
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={editTotal}
                    onChange={(e) => setEditTotal(parseInt(e.target.value) || 0)}
                    className="w-full rounded-xl bg-zinc-950 border border-zinc-700 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">
                      Available Units
                    </label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={editAvailable}
                      onChange={(e) => setEditAvailable(parseInt(e.target.value) || 0)}
                      className="w-full rounded-xl bg-zinc-950 border border-zinc-700 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">
                      Damaged Units
                    </label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={editDamaged}
                      onChange={(e) => setEditDamaged(parseInt(e.target.value) || 0)}
                      className="w-full rounded-xl bg-zinc-950 border border-zinc-700 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as "AVAILABLE" | "UNAVAILABLE")}
                    className="w-full rounded-xl bg-zinc-950 border border-zinc-700 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="AVAILABLE">AVAILABLE</option>
                    <option value="UNAVAILABLE">UNAVAILABLE</option>
                  </select>
                </div>

                {editError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                    {editError}
                  </div>
                )}

                <div className="pt-3 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="px-5 py-2 text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-zinc-950 rounded-xl disabled:opacity-50 transition-colors shadow-lg shadow-cyan-500/20 flex items-center gap-2"
                  >
                    {editLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
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
