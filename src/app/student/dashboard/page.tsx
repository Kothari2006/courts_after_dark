import { requireRole } from "@/lib/auth-utils";
import { StudentHero } from "@/components/illustrations/HeroIllustrations";
import connectToDatabase from "@/lib/mongodb";
import Facility, { IFacility } from "@/models/Facility";
import Booking, { IBooking } from "@/models/Booking";
import Waitlist from "@/models/Waitlist";
import EquipmentCheckout from "@/models/EquipmentCheckout";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import DashboardStatCard from "@/components/dashboard/DashboardStatCard";
import FacilityCard, { FacilityItem } from "@/components/dashboard/FacilityCard";
import BookingCard, { BookingItem } from "@/components/dashboard/BookingCard";
import EmptyState from "@/components/dashboard/EmptyState";
import { DEMO_FACILITIES } from "@/lib/data/demo-facilities";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Compass,
  Zap,
  Dumbbell,
  Bell,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Types } from "mongoose";

export default async function StudentDashboardPage() {
  const user = await requireRole(["STUDENT", "ADMIN"]);

  await connectToDatabase();
  const userObjectId = new Types.ObjectId(user.id);

  // Parallel fetches for rich student overview
  const [
    dbFacilities,
    upcomingBookings,
    activeWaitlistCount,
    activeEquipmentCount,
  ] = await Promise.all([
    Facility.find({ status: "ACTIVE" })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean<IFacility[]>(),

    Booking.find({
      user: userObjectId,
      status: { $in: ["CONFIRMED", "PENDING"] },
      endAt: { $gte: new Date() },
    })
      .populate("facility", "name sportType location")
      .sort({ startAt: 1 })
      .limit(3)
      .lean(),

    Waitlist.countDocuments({
      user: userObjectId,
      status: "WAITING",
    }),

    EquipmentCheckout.countDocuments({
      user: userObjectId,
      status: { $in: ["REQUESTED", "ISSUED"] },
    }),
  ]);

  const featuredFacilities: FacilityItem[] =
    dbFacilities.length > 0
      ? JSON.parse(JSON.stringify(dbFacilities))
      : DEMO_FACILITIES.slice(0, 3);

  const formattedBookings: BookingItem[] = upcomingBookings.map((b: any) => ({
    id: b._id.toString(),
    facilityName: b.facility?.name || "Campus Court",
    sportType: b.facility?.sportType || "SPORTS",
    location: b.facility?.location,
    bookingDate: new Date(b.bookingDate).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }),
    startTime: b.startTime,
    endTime: b.endTime,
    status: b.status,
    bookingType: b.bookingType || "REGULAR",
  }));

  const activeBookingsCount = formattedBookings.length;

  return (
    <DashboardLayout title="Student Overview">
      <div className="space-y-8">
        {/* Personalized Student Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-r from-[var(--surface)] via-[var(--app-bg)] to-[var(--app-bg)] p-6 sm:p-8 shadow-2xl">
          <div className="absolute right-0 top-0 -translate-y-12 translate-x-12 h-64 w-64 rounded-full bg-lime-400/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-lime-400/10 border border-lime-400/20 px-3 py-1 text-xs font-bold text-lime-400 mb-3">
                <Zap className="h-3 w-3 fill-lime-400" /> Student Sports Access Active
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Welcome back, {user.name}!
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
                Explore campus courts, check live slot availability, manage your match reservations, and checkout tournament gear.
              </p>
            </div>

            <StudentHero className="hidden lg:block w-64 xl:w-72 shrink-0 animate-float -my-4" />

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/facilities"
                className="inline-flex items-center gap-2 rounded-xl bg-lime-400 px-5 py-3 text-xs font-black text-slate-950 transition-all hover:bg-lime-300 shadow-xl shadow-lime-400/20"
              >
                <Compass className="h-4 w-4" />
                Explore Facilities
              </Link>
              <Link
                href="/bookings"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-xs font-bold text-slate-200 transition-all hover:bg-slate-800 hover:text-white"
              >
                My Bookings
              </Link>
            </div>
          </div>
        </div>

        {/* Student Stat Cards */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Student Activity Quota
            </h3>
            <span className="text-[11px] text-slate-500 font-medium">
              Fairness Rule: Max 3 Active Bookings
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <DashboardStatCard
              title="Upcoming Bookings"
              value={activeBookingsCount}
              subtitle={`${activeBookingsCount} reserved session(s)`}
              icon={CalendarDays}
              badge={`${activeBookingsCount}/3 Active`}
              badgeColor="lime"
            />
            <DashboardStatCard
              title="Waiting List Slots"
              value={activeWaitlistCount}
              subtitle="Pending slot promotions"
              icon={Clock}
              badge={activeWaitlistCount > 0 ? "Queued" : "None"}
              badgeColor="cyan"
            />
            <DashboardStatCard
              title="Equipment Checkouts"
              value={activeEquipmentCount}
              subtitle="Gear rented or requested"
              icon={Dumbbell}
              badge={activeEquipmentCount > 0 ? "Active" : "None"}
              badgeColor="amber"
            />
          </div>
        </div>

        {/* Quick Action Navigation Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link
            href="/facilities"
            className="p-4 rounded-2xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/80 hover:border-lime-500/40 transition-all group"
          >
            <Compass className="h-6 w-6 text-lime-400 mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="text-sm font-bold text-white">Find Courts</h4>
            <p className="text-xs text-slate-400 mt-1">Book slots in real time</p>
          </Link>
          <Link
            href="/bookings"
            className="p-4 rounded-2xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/80 hover:border-lime-500/40 transition-all group"
          >
            <CalendarDays className="h-6 w-6 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="text-sm font-bold text-white">My Bookings</h4>
            <p className="text-xs text-slate-400 mt-1">View & cancel sessions</p>
          </Link>
          <Link
            href="/equipment"
            className="p-4 rounded-2xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/80 hover:border-lime-500/40 transition-all group"
          >
            <Dumbbell className="h-6 w-6 text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="text-sm font-bold text-white">Borrow Gear</h4>
            <p className="text-xs text-slate-400 mt-1">Rent balls, rackets & pads</p>
          </Link>
          <Link
            href="/notifications"
            className="p-4 rounded-2xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/80 hover:border-lime-500/40 transition-all group"
          >
            <Bell className="h-6 w-6 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="text-sm font-bold text-white">Alerts</h4>
            <p className="text-xs text-slate-400 mt-1">Waitlist & confirmations</p>
          </Link>
        </div>

        {/* Featured Facilities Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Campus Facilities
            </h3>
            <Link
              href="/facilities"
              className="text-xs font-semibold text-lime-400 hover:text-lime-300"
            >
              View All Facilities →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredFacilities.map((facility) => (
              <FacilityCard key={facility._id} facility={facility} />
            ))}
          </div>
        </div>

        {/* Upcoming Sessions List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Upcoming Scheduled Sessions
            </h3>
            <Link
              href="/bookings"
              className="text-xs font-semibold text-lime-400 hover:text-lime-300"
            >
              View All Bookings →
            </Link>
          </div>

          {formattedBookings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {formattedBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No upcoming court sessions"
              description="You have not booked any courts for tonight. Discover available evening slots across campus courts."
              actionLabel="Book a Court Now"
              actionHref="/facilities"
              icon={CalendarDays}
              art="calendar"
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
