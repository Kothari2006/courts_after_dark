"use client";

import ThemeToggle from "@/components/ThemeToggle";
import Avatar from "@/components/illustrations/Avatar";
import { useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import {
  Menu,
  User,
  LogOut,
  CalendarDays,
  ShieldCheck,
} from "lucide-react";
import NotificationBell from "@/components/notifications/NotificationBell";

interface StudentHeaderProps {
  onMenuClick: () => void;
  title?: string;
}

export default function StudentHeader({ onMenuClick, title = "Dashboard" }: StudentHeaderProps) {
  const { data: session } = useSession();
  const user = session?.user;

  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-800/80 bg-[var(--app-bg)]/85 px-4 sm:px-6 lg:px-8 backdrop-blur-md">
      {/* Left: Mobile trigger & Page Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="rounded-xl p-2 text-slate-400 hover:bg-slate-900 hover:text-white lg:hidden border border-slate-800"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            {title}
          </h1>
          <p className="hidden sm:block text-xs text-slate-400">
            Courts After Dark • Student Facility Reservation Desk
          </p>
        </div>
      </div>

      {/* Right: Operational Status, Notifications & Profile Menu */}
      <div className="flex items-center gap-3">
        {/* Status indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-lime-400"></span>
          </span>
          <span className="font-semibold text-lime-400">Night Access Open</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">Slots till 23:00</span>
        </div>

        <ThemeToggle />
        <NotificationBell accent="lime" />

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setProfileOpen(!profileOpen);
            }}
            className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 p-1.5 sm:px-3 sm:py-2 hover:border-slate-700 transition-colors"
          >
            <Avatar name={user?.name} size={30} />
            <span className="hidden sm:inline-block text-xs font-bold text-slate-200 max-w-[100px] truncate">
              {user?.name || "Student"}
            </span>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-800 bg-[var(--surface)] p-2 shadow-2xl z-50">
              <div className="p-3 border-b border-slate-800 mb-1">
                <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-lime-400">
                  <ShieldCheck className="h-3 w-3" /> Student Verified
                </div>
              </div>
              <Link
                href="/profile"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <User className="h-4 w-4 text-slate-400" /> My Profile
              </Link>
              <Link
                href="/bookings"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <CalendarDays className="h-4 w-4 text-slate-400" /> My Bookings
              </Link>
              <div className="my-1 border-t border-slate-800" />
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

