import { notFound } from "next/navigation";
import Link from "next/link";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongodb";
import Facility, { IFacility } from "@/models/Facility";
import { requireAuth } from "@/lib/auth-utils";
import { DEMO_FACILITIES } from "@/lib/data/demo-facilities";
import FacilityAvailabilityView from "@/components/dashboard/FacilityAvailabilityView";
import FacilityReviewsSection from "@/components/reviews/FacilityReviewsSection";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import type { FacilityItem } from "@/components/dashboard/FacilityCard";
import {
  MapPin,
  Users,
  Clock,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  X,
  Globe,
  CalendarCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function FacilityDetailPage({ params }: PageProps) {
  await requireAuth();
  const { id } = await params;

  const demoFacility = DEMO_FACILITIES.find((facility) => facility.id === id);
  let facility: FacilityItem & { _id: string };

  if (demoFacility) {
    facility = {
      ...demoFacility,
      _id: id,
    };
  } else {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    notFound();
  }

    await connectToDatabase();
    const facilityDoc = await Facility.findById(id).lean<IFacility>();

    if (!facilityDoc) {
      notFound();
    }

    const serializedFacility = JSON.parse(JSON.stringify(facilityDoc));
    facility = {
      ...serializedFacility,
      _id: id,
    };
  }

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
          label: "Available for Booking",
          class: "bg-lime-400/10 text-lime-400 border-lime-400/30",
          icon: CheckCircle2,
        };
      case "MAINTENANCE":
        return {
          label: "Under Scheduled Maintenance",
          class: "bg-amber-500/10 text-amber-400 border-amber-500/30",
          icon: AlertTriangle,
        };
      default:
        return {
          label: "Facility Inactive",
          class: "bg-rose-500/10 text-rose-400 border-rose-500/30",
          icon: X,
        };
    }
  };

  const status = getStatusBadge();
  const StatusIcon = status.icon;

  return (
    <DashboardLayout title={facility.name}>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <Link
          href="/facilities"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Facilities Catalog
        </Link>

        {/* Hero Card */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-[var(--surface)] p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span
              className={cn(
                "text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full border",
                getSportBadgeColor(facility.sportType)
              )}
            >
              {facility.sportType}
            </span>
            <span
              className={cn(
                "text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1.5",
                status.class
              )}
            >
              <StatusIcon className="h-3.5 w-3.5" />
              {status.label}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {facility.name}
          </h1>

          <p className="mt-2 text-sm text-slate-400 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-lime-400 shrink-0" />
            <span>{facility.location}</span>
          </p>

          <p className="mt-4 text-sm text-slate-300 leading-relaxed max-w-3xl">
            {facility.description}
          </p>
        </div>

        {/* Specifications Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-800 bg-[var(--surface)] p-5">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase mb-2">
              <Users className="h-4 w-4 text-lime-400" />
              <span>Court Capacity</span>
            </div>
            <div className="text-2xl font-black text-white">
              {facility.capacity} <span className="text-xs text-slate-500 font-normal">Players</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Maximum allowed per booking</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-[var(--surface)] p-5">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase mb-2">
              <Clock className="h-4 w-4 text-lime-400" />
              <span>Slot Duration</span>
            </div>
            <div className="text-2xl font-black text-white">
              {facility.slotDuration} <span className="text-xs text-slate-500 font-normal">Minutes</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Single reservation length</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-[var(--surface)] p-5">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase mb-2">
              <CalendarCheck className="h-4 w-4 text-lime-400" />
              <span>Operating Hours</span>
            </div>
            <div className="text-2xl font-black text-lime-400">
              {facility.operatingHours?.open} - {facility.operatingHours?.close}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Daily court schedule</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-[var(--surface)] p-5">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase mb-2">
              <Globe className="h-4 w-4 text-lime-400" />
              <span>Timezone</span>
            </div>
            <div className="text-xl font-black text-white truncate">
              {facility.timezone || "Asia/Kolkata"}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Campus standard reference</p>
          </div>
        </div>

        <FacilityAvailabilityView
          facilityId={facility._id}
          isDemo={facility.isDemo}
          demoName={facility.name}
          demoSportType={facility.sportType}
          demoLocation={facility.location}
          demoOperatingHours={facility.operatingHours}
          demoSlotDuration={facility.slotDuration}
        />

        {!facility.isDemo && (
          /* Facility Reviews & Ratings Section */
          <FacilityReviewsSection facilityId={facility._id} />
        )}
      </div>
    </DashboardLayout>
  );
}

