"use client";

import Avatar from "@/components/illustrations/Avatar";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Trophy,
  Users,
  CheckSquare,
  Calendar,
  AlertTriangle,
  Bell,
  UserCheck,
  LogOut,
  GraduationCap,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TeacherSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const teacherNavItems = [
  { tab: "overview", label: "Overview", icon: LayoutDashboard },
  { tab: "activities", label: "Sports Activities", icon: Trophy },
  { tab: "bookings", label: "Student Bookings", icon: Users },
  { tab: "attendance", label: "Attendance", icon: CheckSquare },
  { tab: "schedule", label: "Facility Schedule", icon: Calendar },
  { tab: "maintenance", label: "Damage Reports", icon: AlertTriangle },
];

export default function TeacherSidebar({
  isOpen,
  onClose,
  activeTab = "overview",
}: TeacherSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || activeTab || "overview";
  const { data: session } = useSession();
  const user = session?.user;

  // Items are real links, so navigation works from any teacher page
  // (events, profile, notifications) — not only from the dashboard.
  const handleNavClick = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex w-72 flex-col bg-[var(--surface)] border-r border-purple-950/60 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand Header */}
        <div className="flex h-20 items-center justify-between px-6 border-b border-purple-950/60 bg-[var(--surface)]/50">
          <Link href="/teacher/dashboard" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-[var(--brand-accent)] shadow-lg shadow-purple-500/25 group-hover:scale-105 transition-transform">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-black text-lg tracking-tight text-white block leading-none">
                COURTS
              </span>
              <span className="text-[11px] font-bold tracking-widest text-purple-400 uppercase">
                FACULTY PORTAL
              </span>
            </div>
          </Link>

          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-purple-950/60 hover:text-white lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-purple-400/80">
            Faculty Management
          </div>

          <Link
            href="/teacher/events"
            onClick={onClose}
            className={cn(
              "w-full group flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all relative text-left",
              pathname.startsWith("/teacher/events")
                ? "bg-gradient-to-r from-purple-500/20 to-transparent text-purple-300 border-l-4 border-purple-500 shadow-sm shadow-purple-900/30"
                : "text-slate-400 hover:bg-purple-950/30 hover:text-slate-200"
            )}
          >
            <Trophy className="h-5 w-5 text-purple-400" />
            <span>Tournaments & Events</span>
          </Link>

          {teacherNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === "/teacher/dashboard" && currentTab === item.tab;

            return (
              <Link
                key={item.tab}
                href={item.tab === "overview" ? "/teacher/dashboard" : `/teacher/dashboard?tab=${item.tab}`}
                onClick={handleNavClick}
                className={cn(
                  "w-full group flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all relative text-left",
                  isActive
                    ? "bg-gradient-to-r from-purple-500/20 to-transparent text-purple-300 border-l-4 border-purple-500 shadow-sm shadow-purple-900/30"
                    : "text-slate-400 hover:bg-purple-950/30 hover:text-slate-200"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 transition-colors",
                    isActive
                      ? "text-purple-400"
                      : "text-slate-500 group-hover:text-purple-300"
                  )}
                />
                <span>{item.label}</span>
                {isActive && (
                  <span className="ml-auto h-2 w-2 rounded-full bg-purple-400 shadow-[0_0_8px_var(--color-purple-400)]" />
                )}
              </Link>
            );
          })}

          <div className="pt-4 pb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-purple-400/80">
            Account & Alerts
          </div>

          <Link
            href="/notifications"
            onClick={onClose}
            className={cn(
              "group flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all relative",
              pathname === "/notifications"
                ? "bg-purple-500/20 text-purple-300 border-l-4 border-purple-500"
                : "text-slate-400 hover:bg-purple-950/30 hover:text-slate-200"
            )}
          >
            <Bell className="h-5 w-5 text-slate-500 group-hover:text-purple-300 transition-colors" />
            <span>Notifications</span>
          </Link>

          <Link
            href="/profile"
            onClick={onClose}
            className={cn(
              "group flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all relative",
              pathname === "/profile"
                ? "bg-purple-500/20 text-purple-300 border-l-4 border-purple-500"
                : "text-slate-400 hover:bg-purple-950/30 hover:text-slate-200"
            )}
          >
            <UserCheck className="h-5 w-5 text-slate-500 group-hover:text-purple-300 transition-colors" />
            <span>Profile</span>
          </Link>
        </div>

        {/* Profile Card & Logout Footer */}
        <div className="p-4 border-t border-purple-950/60 bg-[var(--surface)]/70">
          <div className="flex items-center gap-3 rounded-xl bg-purple-950/40 p-3 border border-purple-900/40">
            <Avatar name={user?.name} size={40} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-200">
                {user?.name || "Faculty Member"}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-purple-400" />
                <span className="text-[10px] font-semibold text-purple-400 uppercase tracking-wide">
                  Teacher / Faculty
                </span>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              title="Sign Out"
              className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

