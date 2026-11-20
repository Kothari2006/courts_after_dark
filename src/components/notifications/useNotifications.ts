"use client";

import { useCallback, useEffect, useState } from "react";

export interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

export function timeAgo(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US");
}

export function useNotifications(limit = 20, pollMs = 0) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/notifications?limit=${limit}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load notifications");
      setItems(data.notifications);
      setUnreadCount(data.unreadCount);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    const first = setTimeout(load, 0);
    const timer = pollMs > 0 ? setInterval(load, pollMs) : undefined;
    return () => {
      clearTimeout(first);
      if (timer) clearInterval(timer);
    };
  }, [load, pollMs]);

  const markRead = useCallback(
    async (id: string) => {
      const target = items.find((n) => n._id === id);
      setItems((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
      if (target && !target.isRead) setUnreadCount((c) => Math.max(0, c - 1));
      await fetch(`/api/notifications/${id}`, { method: "PATCH" }).catch(() => {});
    },
    [items]
  );

  const markAllRead = useCallback(async () => {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    await fetch("/api/notifications", { method: "PATCH" }).catch(() => {});
  }, []);

  const remove = useCallback(
    async (id: string) => {
      const target = items.find((n) => n._id === id);
      setItems((prev) => prev.filter((n) => n._id !== id));
      if (target && !target.isRead) setUnreadCount((c) => Math.max(0, c - 1));
      await fetch(`/api/notifications/${id}`, { method: "DELETE" }).catch(() => {});
    },
    [items]
  );

  return { items, unreadCount, loading, error, reload: load, markRead, markAllRead, remove };
}
