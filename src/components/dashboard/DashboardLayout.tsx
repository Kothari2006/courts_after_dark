"use client";

import { Suspense, useState } from "react";
import StudentSidebar from "./StudentSidebar";
import StudentHeader from "./StudentHeader";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-slate-100 flex">
      {/* Sidebar */}
      {/* useSearchParams in the sidebar needs a Suspense boundary for static pages */}
      <Suspense fallback={<div className="hidden w-72 shrink-0 lg:block" />}>
        <StudentSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </Suspense>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <StudentHeader onMenuClick={() => setSidebarOpen(true)} title={title} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

