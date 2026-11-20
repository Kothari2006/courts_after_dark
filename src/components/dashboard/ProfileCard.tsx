"use client";

import Avatar from "@/components/illustrations/Avatar";
import { useState } from "react";
import { User, Mail, Shield, Phone, CheckCircle2, AlertCircle } from "lucide-react";

interface ProfileCardProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    role: string;
  };
}

export default function ProfileCard({ user }: ProfileCardProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [department, setDepartment] = useState("School of Engineering & Technology");
  const [studentId, setStudentId] = useState("CAD-2026-" + user.id.slice(-4).toUpperCase());
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Profile Header Summary */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-[var(--surface)] p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <Avatar name={user.name} size={88} className="shadow-xl ring-4 ring-[var(--brand-soft)]" />

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-2xl font-black text-white">{user.name || "User"}</h2>
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-lime-400/10 text-lime-400 border border-lime-400/30">
                {user.role}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">{user.email}</p>

            <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-lime-400" />
                <span>Account Verified</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-lime-400" />
                <span>{user.role === "STUDENT" ? "Campus Athlete Clearance" : "Campus Staff Access"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notice Banner */}
      {savedNotice && (
        <div className="p-4 rounded-2xl bg-lime-400/10 border border-lime-400/30 text-lime-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Profile preferences updated for this session. (Profile persistence API will be linked in the User phase).</span>
        </div>
      )}

      {/* Details Form Card */}
      <div className="rounded-3xl border border-slate-800 bg-[var(--surface)] p-6 sm:p-8 shadow-xl">
        <h3 className="text-base font-bold text-white mb-6">{user.role === "STUDENT" ? "Student" : "Staff"} Information</h3>

        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={user.name || ""}
                  disabled
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-sm focus:outline-none cursor-not-allowed opacity-80"
                />
                <User className="h-4 w-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Official name from campus directory
              </span>
            </div>

            {/* University Email */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                University Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={user.email || ""}
                  disabled
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-sm focus:outline-none cursor-not-allowed opacity-80"
                />
                <Mail className="h-4 w-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Primary university authentication handle
              </span>
            </div>

            {/* Student ID */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                {user.role === "STUDENT" ? "Student ID / Roll No." : "Employee ID"}
              </label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="CAD-2026-XXXX"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-lime-400 transition-colors"
              />
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Department / Program
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Computer Science"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-lime-400 transition-colors"
              />
            </div>

            {/* Phone Number */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Phone Number (For Booking SMS Alerts)
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-lime-400 transition-colors"
                />
                <Phone className="h-4 w-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <AlertCircle className="h-4 w-4" />
              <span>Only editable fields are updated locally</span>
            </div>
            <button
              type="submit"
              className="py-2.5 px-6 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-bold text-xs transition-colors shadow-md shadow-lime-400/10"
            >
              Save Details
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

