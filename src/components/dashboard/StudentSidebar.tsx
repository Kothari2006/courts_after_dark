"use client";

import Avatar from "@/components/illustrations/Avatar";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Compass,
  CalendarDays,
  Clock,
  Dumbbell,
  Bell,
  UserCheck,
  LogOut,
  Zap,
  X,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StudentSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const navItems = [
  { href: "/student/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/facilities", label: "Explore Facilities", icon: Compass },
  { href: "/events", label: "Tournaments & Events", icon: Trophy },
  { href: "/bookings", label: "My Bookings", icon: CalendarDays },
  { href: "/bookings?tab=waitlist", label: "Waiting List", icon: Clock },
  { href: "/equipment", label: "Equipment", icon: Dumbbell },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/profile", label: "Profile", icon: UserCheck },
];

export default function StudentSidebar({ isOpen, onClose }: StudentSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const onWaitlistTab = searchParams.get("tab") === "waitlist";
  const { data: session } = useSession();
  const user = session?.user;

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
          "fixed top-0 bottom-0 left-0 z-50 flex w-72 flex-col bg-[var(--surface)] border-r border-slate-800/80 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand Header */}
        <div className="flex h-20 items-center justify-between px-6 border-b border-slate-800/80">
          <Link href="/student/dashboard" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-lime-400 to-[var(--brand-accent)] shadow-lg shadow-lime-400/25 group-hover:scale-105 transition-transform">
              <Zap className="h-5 w-5 text-slate-950 fill-slate-950" />
            </div>
            <div>
              <span className="font-black text-lg tracking-tight text-white block leading-none">
                COURTS
              </span>
              <span className="text-[11px] font-bold tracking-widest text-lime-400 uppercase">
                AFTER DARK
              </span>
            </div>
          </Link>

          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Student Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const pureHref = item.href.split("?")[0];
            const isWaitlistItem = item.href.includes("tab=waitlist");
            const pathMatch =
              pathname === pureHref ||
              (pureHref !== "/student/dashboard" && pathname.startsWith(pureHref + "/"));
            const isActive =
              pureHref === "/bookings"
                ? pathMatch && isWaitlistItem === onWaitlistTab
                : pathMatch;

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => onClose && onClose()}
                className={cn(
                  "group flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all relative",
                  isActive
                    ? "bg-gradient-to-r from-lime-400/15 to-transparent text-lime-300 border-l-4 border-lime-400"
                    : "text-slate-400 hover:bg-slate-900/80 hover:text-slate-200"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 transition-colors",
                    isActive
                      ? "text-lime-400"
                      : "text-slate-500 group-hover:text-slate-300"
                  )}
                />
                <span>{item.label}</span>
                {isActive && (
                  <span className="ml-auto h-2 w-2 rounded-full bg-lime-400 shadow-[0_0_8px_var(--color-lime-400)]" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Profile Card & Logout Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-[var(--surface)]/60">
          <div className="flex items-center gap-3 rounded-xl bg-slate-900/80 p-3 border border-slate-800">
            <Avatar name={user?.name} size={40} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-200">
                {user?.name || "Student"}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-lime-400" />
                <span className="text-[10px] font-semibold text-lime-400 uppercase tracking-wide">
                  {user?.role || "STUDENT"}
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
