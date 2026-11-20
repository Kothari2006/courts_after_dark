"use client";

import EmptyArt from "@/components/illustrations/EmptyArt";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Trash2, RefreshCw } from "lucide-react";
import { timeAgo, useNotifications } from "@/components/notifications/useNotifications";

export default function NotificationsClient({ accent }: { accent: "lime" | "purple" }) {
  const router = useRouter();
  const { items, unreadCount, loading, error, reload, markRead, markAllRead, remove } =
    useNotifications(50);
  const text = accent === "purple" ? "text-purple-400" : "text-lime-400";
  const dot = accent === "purple" ? "bg-purple-400" : "bg-lime-400";

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-white">Notifications</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : "You are all caught up"}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={reload}
            className="rounded-xl border border-slate-800 p-2.5 text-slate-400 hover:text-white hover:bg-slate-900"
            aria-label="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={markAllRead}
            disabled={unreadCount === 0}
            className="rounded-xl border border-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <CheckCheck className="h-4 w-4" /> Mark all read
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-20 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 py-16 text-center">
          <EmptyArt variant="bell" className="mx-auto mb-3" />
          <p className="font-bold text-white">No notifications yet</p>
          <p className="text-xs text-slate-400 mt-1">
            Booking, waitlist and equipment updates will show up here.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((n) => (
            <li
              key={n._id}
              className={`group rounded-2xl border p-4 flex items-start gap-3 transition-colors ${
                n.isRead ? "border-slate-800/70 bg-slate-900/30" : "border-slate-700 bg-slate-900/80"
              }`}
            >
              <span
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.isRead ? "bg-slate-700" : dot}`}
              />
              <button
                className="flex-1 text-left min-w-0"
                onClick={() => {
                  markRead(n._id);
                  if (n.link) router.push(n.link);
                }}
              >
                <p className={`text-sm font-bold ${n.isRead ? "text-slate-300" : text}`}>
                  {n.title}
                </p>
                <p className="text-xs text-slate-400 mt-0.5 break-words">{n.message}</p>
                <p className="text-[10px] text-slate-500 mt-2">{timeAgo(n.createdAt)}</p>
              </button>
              <button
                onClick={() => remove(n._id)}
                className="rounded-lg p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 sm:opacity-0 group-hover:opacity-100 focus:opacity-100 transition"
                aria-label="Delete notification"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
