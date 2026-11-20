import connectToDatabase from "@/lib/mongodb";
import Facility, { IFacility } from "@/models/Facility";
import Booking, { IBooking } from "@/models/Booking";
import User from "@/models/User";
import Equipment, { IEquipment } from "@/models/Equipment";
import EquipmentCheckout from "@/models/EquipmentCheckout";
import Maintenance from "@/models/Maintenance";

interface PopulatedMaintenanceDoc {
  _id: { toString(): string } | string;
  facility?: { name?: string; sportType?: string } | null;
  createdBy?: { email?: string } | null;
  reason: string;
  status: string;
  startAt: Date;
  endAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface PopulatedBookingDoc {
  _id: { toString(): string } | string;
  facility?: { name?: string; sportType?: string } | null;
  user?: { name?: string; email?: string } | null;
  status: string;
  startTime?: string;
  endTime?: string;
  cancelledAt?: Date;
  createdAt: Date;
}

interface LeanUserDoc {
  _id: { toString(): string } | string;
  name?: string;
  email: string;
  createdAt: Date;
}

interface PopulatedCheckoutDoc {
  _id: { toString(): string } | string;
  user?: { name?: string; email?: string } | null;
  items?: Array<{ equipment?: { name?: string } | null }>;
  status: string;
  issuedAt?: Date;
  returnedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnalyticsPeriodParams {
  period?: "7d" | "30d" | "90d" | "custom";
  startDate?: string | Date;
  endDate?: string | Date;
}

export interface SummaryStats {
  totalFacilities: number;
  activeFacilities: number;
  totalStudents: number;
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  pendingMaintenance: number;
  equipmentCurrentlyIssued: number;
}

export interface BookingTrendItem {
  date: string;
  total: number;
  confirmed: number;
  cancelled: number;
}

export interface SportPopularityItem {
  sportType: string;
  count: number;
}

export interface FacilityBookingPopularityItem {
  facilityId: string;
  facilityName: string;
  sportType: string;
  count: number;
}

export interface FacilityUtilizationItem {
  facilityId: string;
  facilityName: string;
  sportType: string;
  confirmedHours: number;
  availableOperatingHours: number;
  utilizationPercentage: number;
}

export interface EquipmentAnalyticsSummary {
  totalItems: number;
  availableQuantity: number;
  issuedQuantity: number;
  damagedQuantity: number;
  overdueCount: number;
  mostIssuedEquipment: Array<{
    equipmentId: string;
    name: string;
    category: string;
    checkoutCount: number;
  }>;
}

export interface MaintenanceAnalyticsSummary {
  totalRecords: number;
  scheduledCount: number;
  inProgressCount: number;
  completedCount: number;
  cancelledCount: number;
  facilitiesAffectedCount: number;
  recentMaintenance: Array<{
    _id: string;
    facilityName: string;
    sportType: string;
    reason: string;
    status: string;
    startAt: string;
    endAt: string;
    createdByEmail?: string;
  }>;
}

export interface RecentActivityItem {
  id: string;
  type:
    | "BOOKING_CREATED"
    | "BOOKING_CANCELLED"
    | "STUDENT_REGISTERED"
    | "EQUIPMENT_CHECKOUT"
    | "EQUIPMENT_RETURNED"
    | "MAINTENANCE_SCHEDULED"
    | "MAINTENANCE_COMPLETED";
  title: string;
  description: string;
  timestamp: string;
  badge: string;
}

export interface AdminAnalyticsResult {
  period: string;
  startDate: string;
  endDate: string;
  summary: SummaryStats;
  bookingAnalytics: {
    trends: BookingTrendItem[];
    primeTimeCount: number;
    regularCount: number;
    popularSports: SportPopularityItem[];
    topFacilities: FacilityBookingPopularityItem[];
  };
  facilityUtilization: FacilityUtilizationItem[];
  equipmentAnalytics: EquipmentAnalyticsSummary;
  maintenanceAnalytics: MaintenanceAnalyticsSummary;
  recentActivity: RecentActivityItem[];
}

/**
 * Calculates start and end timestamps based on requested period.
 */
export function resolveDateRange({
  period = "30d",
  startDate,
  endDate,
}: AnalyticsPeriodParams): { start: Date; end: Date; periodLabel: string } {
  const now = new Date();

  if (period === "custom") {
    if (!startDate || !endDate) {
      throw new Error("INVALID_CUSTOM_DATE_RANGE");
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
      throw new Error("INVALID_DATE_RANGE");
    }
    return { start, end, periodLabel: "custom" };
  }

  let days = 30;
  if (period === "7d") days = 7;
  else if (period === "90d") days = 90;

  const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return { start, end: now, periodLabel: period };
}

/**
 * Main analytics service function. Aggregates data from MongoDB collections.
 */
export async function getAdminAnalytics(
  params: AnalyticsPeriodParams
): Promise<AdminAnalyticsResult> {
  await connectToDatabase();

  const { start, end, periodLabel } = resolveDateRange(params);

  // 1. Parallel independent data fetching
  const [
    totalFacilities,
    activeFacilities,
    totalStudents,
    totalBookingsInPeriod,
    confirmedBookingsInPeriod,
    cancelledBookingsInPeriod,
    pendingMaintenanceCount,
    allFacilities,
    allEquipment,
    overdueCheckoutsCount,
    mostIssuedEquipmentAgg,
    maintenanceStatsAgg,
    recentMaintenanceDocs,
    bookingTrendsAgg,
    primeTimeAgg,
    facilityPopularityAgg,
    sportPopularityAgg,
    recentBookings,
    recentStudents,
    recentCheckouts,
    recentMaintenanceActivity,
  ] = await Promise.all([
    // Facilities counts
    Facility.countDocuments(),
    Facility.countDocuments({ status: "ACTIVE" }),

    // Total Students / Faculty
    User.countDocuments({ role: { $in: ["STUDENT", "TEACHER"] } }),

    // Bookings in period
    Booking.countDocuments({ createdAt: { $gte: start, $lte: end } }),
    Booking.countDocuments({
      status: { $in: ["CONFIRMED", "COMPLETED"] },
      createdAt: { $gte: start, $lte: end },
    }),
    Booking.countDocuments({
      status: "CANCELLED",
      createdAt: { $gte: start, $lte: end },
    }),

    // Pending Maintenance (SCHEDULED or IN_PROGRESS)
    Maintenance.countDocuments({ status: { $in: ["SCHEDULED", "IN_PROGRESS"] } }),

    // All active facilities for utilization calculation
    Facility.find({ status: "ACTIVE" }).lean<IFacility[]>(),

    // All equipment for inventory accounting
    Equipment.find().lean<IEquipment[]>(),

    // Overdue equipment checkouts
    EquipmentCheckout.countDocuments({
      status: "ISSUED",
      expectedReturnAt: { $lt: new Date() },
    }),

    // Most frequently issued equipment
    EquipmentCheckout.aggregate([
      { $match: { status: { $in: ["ISSUED", "RETURNED"] } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.equipment",
          checkoutCount: { $sum: "$items.quantity" },
        },
      },
      { $sort: { checkoutCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "equipments",
          localField: "_id",
          foreignField: "_id",
          as: "equipmentDoc",
        },
      },
      { $unwind: { path: "$equipmentDoc", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          equipmentId: { $toString: "$_id" },
          name: { $ifNull: ["$equipmentDoc.name", "Unknown Item"] },
          category: { $ifNull: ["$equipmentDoc.category", "OTHER"] },
          checkoutCount: 1,
        },
      },
    ]),

    // Maintenance Status Counts
    Promise.all([
      Maintenance.countDocuments(),
      Maintenance.countDocuments({ status: "SCHEDULED" }),
      Maintenance.countDocuments({ status: "IN_PROGRESS" }),
      Maintenance.countDocuments({ status: "COMPLETED" }),
      Maintenance.countDocuments({ status: "CANCELLED" }),
      Maintenance.distinct("facility", { status: { $in: ["SCHEDULED", "IN_PROGRESS"] } }),
    ]),

    // Recent 5 maintenance schedules
    Maintenance.find()
      .populate("facility", "name sportType")
      .populate("createdBy", "email")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean<PopulatedMaintenanceDoc[]>(),

    // Booking Daily Trends in Period
    Booking.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          total: { $sum: 1 },
          confirmed: {
            $sum: { $cond: [{ $in: ["$status", ["CONFIRMED", "COMPLETED"]] }, 1, 0] },
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ["$status", "CANCELLED"] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    // Prime-time vs Regular count in Period
    Booking.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: "$bookingType",
          count: { $sum: 1 },
        },
      },
    ]),

    // Most frequently booked facilities in Period
    Booking.aggregate([
      {
        $match: {
          status: { $in: ["CONFIRMED", "COMPLETED"] },
          createdAt: { $gte: start, $lte: end },
        },
      },
      { $group: { _id: "$facility", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 },
      {
        $lookup: {
          from: "facilities",
          localField: "_id",
          foreignField: "_id",
          as: "facilityDoc",
        },
      },
      { $unwind: { path: "$facilityDoc", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          facilityId: { $toString: "$_id" },
          facilityName: { $ifNull: ["$facilityDoc.name", "Unknown Court"] },
          sportType: { $ifNull: ["$facilityDoc.sportType", "OTHER"] },
          count: 1,
        },
      },
    ]),

    // Popular Sports in Period
    Booking.aggregate([
      {
        $match: {
          status: { $in: ["CONFIRMED", "COMPLETED"] },
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $lookup: {
          from: "facilities",
          localField: "facility",
          foreignField: "_id",
          as: "facilityDoc",
        },
      },
      { $unwind: { path: "$facilityDoc", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$facilityDoc.sportType",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      {
        $project: {
          sportType: { $ifNull: ["$_id", "OTHER"] },
          count: 1,
        },
      },
    ]),

    // Recent Bookings (for Activity log)
    Booking.find()
      .populate("user", "name email")
      .populate("facility", "name sportType")
      .sort({ createdAt: -1 })
      .limit(6)
      .lean<PopulatedBookingDoc[]>(),

    // Recent User Registrations (for Activity log)
    User.find({ role: { $in: ["STUDENT", "TEACHER"] } })
      .select("name email createdAt")
      .sort({ createdAt: -1 })
      .limit(6)
      .lean<LeanUserDoc[]>(),

    // Recent Equipment Checkouts / Returns (for Activity log)
    EquipmentCheckout.find()
      .populate("user", "name email")
      .populate("items.equipment", "name")
      .sort({ updatedAt: -1 })
      .limit(6)
      .lean<PopulatedCheckoutDoc[]>(),

    // Recent Maintenance Activity (for Activity log)
    Maintenance.find()
      .populate("facility", "name")
      .sort({ updatedAt: -1 })
      .limit(6)
      .lean<PopulatedMaintenanceDoc[]>(),
  ]);

  // 2. Equipment Inventory Calculation (Conservation Invariant)
  let totalEquipUnits = 0;
  let availableEquipUnits = 0;
  let damagedEquipUnits = 0;

  for (const item of allEquipment) {
    totalEquipUnits += item.totalQuantity || 0;
    availableEquipUnits += item.availableQuantity || 0;
    damagedEquipUnits += item.damagedQuantity || 0;
  }

  const issuedEquipUnits = Math.max(
    0,
    totalEquipUnits - (availableEquipUnits + damagedEquipUnits)
  );

  // 3. Facility Utilization Calculation
  // Utilization = (Confirmed Booking Hours / Available Operating Hours) * 100
  const daysInPeriod = Math.max(1, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  const facilityUtilization: FacilityUtilizationItem[] = [];

  for (const f of allFacilities) {
    const [openH, openM] = (f.operatingHours?.open || "06:00").split(":").map(Number);
    const [closeH, closeM] = (f.operatingHours?.close || "23:00").split(":").map(Number);

    let dailyMinutes = (closeH * 60 + closeM) - (openH * 60 + openM);
    if (dailyMinutes <= 0) dailyMinutes = 17 * 60; // 17 hours fallback

    const dailyOperatingHours = dailyMinutes / 60;
    const availableOperatingHours = Math.round(dailyOperatingHours * daysInPeriod * 10) / 10;

    // Retrieve confirmed bookings for this facility overlapping the reporting period
    const facilityBookings = await Booking.find({
      facility: f._id,
      status: { $in: ["CONFIRMED", "COMPLETED"] },
      startAt: { $lt: end },
      endAt: { $gt: start },
    })
      .select("startAt endAt")
      .lean<IBooking[]>();

    let confirmedMinutes = 0;
    for (const b of facilityBookings) {
      const bStart = Math.max(b.startAt.getTime(), start.getTime());
      const bEnd = Math.min(b.endAt.getTime(), end.getTime());
      if (bEnd > bStart) {
        confirmedMinutes += (bEnd - bStart) / (1000 * 60);
      }
    }

    const confirmedHours = Math.round((confirmedMinutes / 60) * 10) / 10;
    const utilizationPercentage =
      availableOperatingHours > 0
        ? Math.min(100, Math.round((confirmedHours / availableOperatingHours) * 1000) / 10)
        : 0;

    facilityUtilization.push({
      facilityId: f._id.toString(),
      facilityName: f.name,
      sportType: f.sportType,
      confirmedHours,
      availableOperatingHours,
      utilizationPercentage,
    });
  }

  // Sort facilities by utilization descending
  facilityUtilization.sort((a, b) => b.utilizationPercentage - a.utilizationPercentage);

  // 4. Prime-time vs Regular format
  let primeTimeCount = 0;
  let regularCount = 0;
  for (const item of primeTimeAgg) {
    if (item._id === "PRIME_TIME") primeTimeCount = item.count;
    else regularCount += item.count;
  }

  // 5. Booking Trends formatting
  const trends: BookingTrendItem[] = bookingTrendsAgg.map((t) => ({
    date: t._id,
    total: t.total,
    confirmed: t.confirmed,
    cancelled: t.cancelled,
  }));

  // 6. Maintenance Stats formatting
  const [
    mTotal,
    mScheduled,
    mInProgress,
    mCompleted,
    mCancelled,
    mDistinctFacilities,
  ] = maintenanceStatsAgg;

  const maintenanceAnalytics: MaintenanceAnalyticsSummary = {
    totalRecords: mTotal,
    scheduledCount: mScheduled,
    inProgressCount: mInProgress,
    completedCount: mCompleted,
    cancelledCount: mCancelled,
    facilitiesAffectedCount: Array.isArray(mDistinctFacilities)
      ? mDistinctFacilities.length
      : 0,
    recentMaintenance: recentMaintenanceDocs.map((m) => ({
      _id: m._id.toString(),
      facilityName: m.facility?.name || "Court",
      sportType: m.facility?.sportType || "OTHER",
      reason: m.reason,
      status: m.status,
      startAt: m.startAt.toISOString(),
      endAt: m.endAt.toISOString(),
      createdByEmail: m.createdBy?.email,
    })),
  };

  // 7. Recent Activity Unified Feed
  const activityItems: RecentActivityItem[] = [];

  // Bookings activity
  for (const b of recentBookings) {
    const isCancelled = b.status === "CANCELLED";
    activityItems.push({
      id: `booking-${b._id}`,
      type: isCancelled ? "BOOKING_CANCELLED" : "BOOKING_CREATED",
      title: isCancelled ? "Booking Cancelled" : "Court Reservation Confirmed",
      description: `${b.user?.name || "Student"} reserved ${b.facility?.name || "Court"} for ${b.startTime} - ${b.endTime}`,
      timestamp: (b.cancelledAt || b.createdAt).toISOString(),
      badge: isCancelled ? "Cancelled" : "Confirmed",
    });
  }

  // Registrations activity
  for (const u of recentStudents) {
    activityItems.push({
      id: `user-${u._id}`,
      type: "STUDENT_REGISTERED",
      title: "New Student Registered",
      description: `${u.name || "Student"} registered with email ${u.email}`,
      timestamp: u.createdAt.toISOString(),
      badge: "Student",
    });
  }

  // Checkouts activity
  for (const c of recentCheckouts) {
    const isReturned = c.status === "RETURNED";
    const equipNames = (c.items || [])
      .map((i) => i.equipment?.name || "Gear")
      .join(", ");
    activityItems.push({
      id: `checkout-${c._id}`,
      type: isReturned ? "EQUIPMENT_RETURNED" : "EQUIPMENT_CHECKOUT",
      title: isReturned ? "Equipment Returned" : "Equipment Checked Out",
      description: `${c.user?.name || "Student"} ${isReturned ? "returned" : "borrowed"} ${equipNames || "sports gear"}`,
      timestamp: (c.returnedAt || c.issuedAt || c.createdAt).toISOString(),
      badge: isReturned ? "Returned" : "Issued",
    });
  }

  // Maintenance activity
  for (const m of recentMaintenanceActivity) {
    const isCompleted = m.status === "COMPLETED";
    activityItems.push({
      id: `maintenance-${m._id}`,
      type: isCompleted ? "MAINTENANCE_COMPLETED" : "MAINTENANCE_SCHEDULED",
      title: isCompleted ? "Maintenance Completed" : "Maintenance Scheduled",
      description: `${m.facility?.name || "Court"} • ${m.reason}`,
      timestamp: (m.completedAt || m.createdAt).toISOString(),
      badge: m.status,
    });
  }

  // Sort activities chronologically descending and take top 10
  activityItems.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  const recentActivity = activityItems.slice(0, 10);

  return {
    period: periodLabel,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    summary: {
      totalFacilities,
      activeFacilities,
      totalStudents,
      totalBookings: totalBookingsInPeriod,
      confirmedBookings: confirmedBookingsInPeriod,
      cancelledBookings: cancelledBookingsInPeriod,
      pendingMaintenance: pendingMaintenanceCount,
      equipmentCurrentlyIssued: issuedEquipUnits,
    },
    bookingAnalytics: {
      trends,
      primeTimeCount,
      regularCount,
      popularSports: sportPopularityAgg,
      topFacilities: facilityPopularityAgg,
    },
    facilityUtilization,
    equipmentAnalytics: {
      totalItems: totalEquipUnits,
      availableQuantity: availableEquipUnits,
      issuedQuantity: issuedEquipUnits,
      damagedQuantity: damagedEquipUnits,
      overdueCount: overdueCheckoutsCount,
      mostIssuedEquipment: mostIssuedEquipmentAgg,
    },
    maintenanceAnalytics,
    recentActivity,
  };
}
