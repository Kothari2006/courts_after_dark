"use client";

import { Suspense, useState } from "react";
import TeacherSidebar from "./TeacherSidebar";
import TeacherHeader from "./TeacherHeader";

interface TeacherDashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export default function TeacherDashboardLayout({
  children,
  title = "Faculty Dashboard",
  activeTab = "overview",
  onTabChange,
}: TeacherDashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="theme-teacher min-h-screen bg-[var(--app-bg)] text-slate-100 flex">
      {/* Sidebar */}
      <Suspense fallback={<div className="hidden w-72 shrink-0 lg:block" />}>
        <TeacherSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          activeTab={activeTab}
          onTabChange={onTabChange}
        />
      </Suspense>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TeacherHeader
          onMenuClick={() => setSidebarOpen(true)}
          title={title}
          activeTab={activeTab}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

