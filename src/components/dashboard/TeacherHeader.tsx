"use client";

import ThemeToggle from "@/components/ThemeToggle";
import Avatar from "@/components/illustrations/Avatar";
import { useSession } from "next-auth/react";
import { Menu, Sparkles } from "lucide-react";
import NotificationBell from "@/components/notifications/NotificationBell";

interface TeacherHeaderProps {
  onMenuClick?: () => void;
  title?: string;
  activeTab?: string;
}

export default function TeacherHeader({
  onMenuClick,
  title = "Faculty Dashboard",
  activeTab,
}: TeacherHeaderProps) {
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-purple-950/60 bg-[var(--surface)]/80 px-4 sm:px-6 lg:px-8 backdrop-blur-md">
      <div className="flex items-center gap-4">
        {/* Mobile menu trigger */}
        <button
          onClick={onMenuClick}
          className="rounded-xl border border-purple-900/50 p-2 text-slate-300 hover:bg-purple-950/50 hover:text-white lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>{title}</span>
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-purple-500/10 border border-purple-500/30 px-2.5 py-0.5 text-[10px] font-bold text-purple-300">
              <Sparkles className="h-3 w-3 text-purple-400" /> Faculty
            </span>
          </h1>
          <p className="text-xs text-purple-300/60 font-medium">
            Campus sports activity coordination, attendance tracking & facility management
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        <NotificationBell accent="purple" />

        <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-purple-900/50">
          <div className="text-right">
            <p className="text-xs font-bold text-white leading-tight">
              {user?.name || "Faculty"}
            </p>
            <p className="text-[10px] text-purple-400 font-semibold tracking-wide uppercase">
              Teacher
            </p>
          </div>
          <Avatar name={user?.name} size={38} />
        </div>
      </div>
    </header>
  );
}

