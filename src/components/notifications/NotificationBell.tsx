"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { timeAgo, useNotifications } from "./useNotifications";

interface Props {
  accent?: "lime" | "purple";
}

const ACCENT = {
  lime: {
    badge: "bg-lime-400",
    dot: "bg-lime-400",
    text: "text-lime-400",
    chip: "text-lime-400 bg-lime-400/10 border-lime-400/20",
    btn: "border-slate-800/80 bg-transparent hover:bg-slate-900",
    panel: "border-slate-800 bg-[var(--surface)]",
  },
  purple: {
    badge: "bg-purple-400",
    dot: "bg-purple-400",
    text: "text-purple-400",
    chip: "text-purple-300 bg-purple-400/10 border-purple-400/20",
    btn: "border-purple-900/50 bg-[var(--surface)] hover:bg-purple-950/60",
    panel: "border-purple-900/60 bg-[var(--surface)]",
  },
} as const;

export default function NotificationBell({ accent = "lime" }: Props) {
  const a = ACCENT[accent];
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { items, unreadCount, loading, markRead, markAllRead } = useNotifications(6, 60000);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`relative rounded-xl p-2.5 text-slate-400 hover:text-white border transition-colors ${a.btn}`}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span
            className={`absolute -right-1 -top-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black text-slate-950 flex items-center justify-center ${a.badge}`}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className={`absolute right-0 mt-2 w-[min(24rem,calc(100vw-2rem))] rounded-2xl border p-4 shadow-2xl z-50 ${a.panel}`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="font-bold text-sm text-white flex items-center gap-2">
              <Bell className={`h-4 w-4 ${a.text}`} /> Notifications
            </span>
            {unreadCount > 0 ? (
              <button
                onClick={markAllRead}
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${a.chip}`}
              >
                <CheckCheck className="h-3 w-3" /> Mark all read
              </button>
            ) : (
              <span className="text-[10px] text-slate-500">All caught up</span>
            )}
          </div>

          <div className="mt-3 space-y-2 max-h-80 overflow-y-auto">
            {loading ? (
              <p className="py-6 text-center text-xs text-slate-500">Loading…</p>
            ) : items.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-500">No notifications yet.</p>
            ) : (
              items.map((n) => (
                <button
                  key={n._id}
                  onClick={() => {
                    markRead(n._id);
                    setOpen(false);
                    if (n.link) router.push(n.link);
                  }}
                  className={`w-full text-left p-3 rounded-xl border text-xs transition-colors ${
                    n.isRead
                      ? "bg-slate-900/40 border-slate-800/60 text-slate-400"
                      : "bg-slate-900/90 border-slate-700 text-slate-200"
                  } hover:border-slate-600`}
                >
                  <div
                    className={`font-bold mb-0.5 flex items-center gap-2 ${
                      n.isRead ? "text-slate-300" : a.text
                    }`}
                  >
                    {!n.isRead && <span className={`h-1.5 w-1.5 rounded-full ${a.dot}`} />}
                    <span className="truncate">{n.title}</span>
                  </div>
                  <p className="line-clamp-2">{n.message}</p>
                  <span className="text-[10px] text-slate-500 mt-1.5 block">
                    {timeAgo(n.createdAt)}
                  </span>
                </button>
              ))
            )}
          </div>

          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className={`mt-3 block text-center text-xs font-semibold ${a.text} hover:underline`}
          >
            View all notifications →
          </Link>
        </div>
      )}
    </div>
  );
}
