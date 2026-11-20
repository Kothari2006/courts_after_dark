"use client";

import SportArt from "@/components/illustrations/SportArt";
import { useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Users,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  X,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface FacilityItem {
  _id?: string;
  id?: string;
  name: string;
  sportType: string;
  description: string;
  location: string;
  capacity: number;
  status: "ACTIVE" | "MAINTENANCE" | "INACTIVE";
  operatingHours: { open: string; close: string };
  slotDuration: number;
  images?: string[];
  timezone?: string;
  isDemo?: boolean;
}

interface FacilityCardProps {
  facility: FacilityItem;
}

export default function FacilityCard({ facility }: FacilityCardProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const facilityId = facility._id || facility.id || "";

  const getSportBadgeColor = (sport: string) => {
    switch (sport.toUpperCase()) {
      case "BADMINTON":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case "BASKETBALL":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "FOOTBALL":
        return "bg-lime-500/10 text-lime-400 border-lime-500/30";
      case "CRICKET":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/30";
      case "TENNIS":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
      case "GYM":
        return "bg-purple-500/10 text-purple-400 border-purple-500/30";
      default:
        return "bg-slate-500/10 text-slate-300 border-slate-500/30";
    }
  };

  const getStatusBadge = () => {
    switch (facility.status) {
      case "ACTIVE":
        return {
          label: "Available",
          class: "bg-lime-400/10 text-lime-400 border-lime-400/30",
          icon: CheckCircle2,
        };
      case "MAINTENANCE":
        return {
          label: "Maintenance",
          class: "bg-amber-500/10 text-amber-400 border-amber-500/30",
          icon: AlertTriangle,
        };
      default:
        return {
          label: "Unavailable",
          class: "bg-rose-500/10 text-rose-400 border-rose-500/30",
          icon: X,
        };
    }
  };

  const status = getStatusBadge();
  const StatusIcon = status.icon;

  return (
    <>
      <div className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800/80 bg-[var(--surface)] transition-all hover:border-slate-700 hover:shadow-xl hover:shadow-black/40">
        <div>
          {/* Card Image / Visual Header */}
          <div className="relative h-44 w-full bg-slate-900 overflow-hidden flex items-center justify-center">
            {/* Visual gradient overlay with sports pattern */}
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface)]/70 via-transparent to-transparent z-10" />
            <SportArt sport={facility.sportType} className="absolute inset-0 transition-transform duration-500 group-hover:scale-105" />

            {/* Top status & sport tags */}
            <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between">
              <span
                className={cn(
                  "text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border backdrop-blur-md",
                  getSportBadgeColor(facility.sportType)
                )}
              >
                {facility.sportType}
              </span>

              <span
                className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full border backdrop-blur-md flex items-center gap-1",
                  status.class
                )}
              >
                <StatusIcon className="h-3 w-3" />
                {status.label}
              </span>
            </div>
          </div>

          {/* Details Body */}
          <div className="p-5">
            <h3 className="text-base font-bold text-white group-hover:text-lime-300 transition-colors line-clamp-1">
              {facility.name}
            </h3>

            <p className="mt-1.5 text-xs text-slate-400 line-clamp-2 leading-relaxed">
              {facility.description}
            </p>

            {/* Metadata list */}
            <div className="mt-4 space-y-2 border-t border-slate-800/80 pt-3 text-xs text-slate-300">
              <div className="flex items-center gap-2 text-slate-400">
                <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                <span className="truncate">{facility.location}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-slate-500" />
                  <span>Max Capacity: {facility.capacity} players</span>
                </div>
                <div className="flex items-center gap-1 text-slate-400 font-medium">
                  <Clock className="h-3.5 w-3.5 text-slate-500" />
                  <span>{facility.slotDuration} min slots</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 pt-0 flex gap-2">
          {facilityId ? (
            <Link
              href={`/facilities/${facilityId}`}
              className="flex-1 py-2.5 px-3 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition-colors text-center inline-flex items-center justify-center gap-1.5"
            >
              <span>View Details</span>
              <ExternalLink className="h-3 w-3 text-slate-400" />
            </Link>
          ) : (
            <button
              onClick={() => setDetailsOpen(true)}
              className="flex-1 py-2.5 px-3 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition-colors text-center"
            >
              View Details
            </button>
          )}
          <button
            onClick={() => setDetailsOpen(true)}
            disabled={facility.status !== "ACTIVE"}
            className="py-2.5 px-4 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-bold text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-lime-400/10"
          >
            Check Slots
          </button>
        </div>
      </div>

      {/* Details Modal */}
      {detailsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-[var(--surface)] p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setDetailsOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <span
                className={cn(
                  "text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border",
                  getSportBadgeColor(facility.sportType)
                )}
              >
                {facility.sportType}
              </span>
              <span
                className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1",
                  status.class
                )}
              >
                <StatusIcon className="h-3 w-3" />
                {status.label}
              </span>
            </div>

            <h2 className="text-xl font-black text-white">{facility.name}</h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              {facility.description}
            </p>

            <div className="mt-6 rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Campus Location</span>
                <span className="font-semibold text-white">{facility.location}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Court Capacity</span>
                <span className="font-semibold text-white">{facility.capacity} Players</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Daily Operating Hours</span>
                <span className="font-semibold text-lime-400">
                  {facility.operatingHours.open} - {facility.operatingHours.close}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Standard Slot Duration</span>
                <span className="font-semibold text-white">{facility.slotDuration} Minutes</span>
              </div>
            </div>

            <div className="mt-6 p-3.5 rounded-xl bg-lime-400/5 border border-lime-400/20 text-xs text-lime-300 flex items-start gap-2.5">
              <Sparkles className="h-4 w-4 shrink-0 text-lime-400 mt-0.5" />
              <span>
                Booking engine integration will be connected in Phase 6. Slot selection and conflict-free reservations will be available here.
              </span>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setDetailsOpen(false)}
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

