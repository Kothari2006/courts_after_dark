import connectToDatabase from "@/lib/mongodb";
import Booking, { IBooking } from "@/models/Booking";
import Facility, { IFacility, SportType } from "@/models/Facility";
import Equipment, { IEquipment } from "@/models/Equipment";
import EquipmentCheckout from "@/models/EquipmentCheckout";
import Maintenance from "@/models/Maintenance";
import User, { IUser, UserRole } from "@/models/User";
import { resolveDateRange } from "./analytics.service";
import { ReportQueryInput } from "@/lib/validations/report";
import { generateCsvString } from "@/lib/csv-helper";
import mongoose from "mongoose";

export interface ReportDateRange {
  start: Date;
  end: Date;
  label: string;
}

/**
 * Resolves date range for reports based on period or custom inputs.
 */
export function getReportDateRange(params: {
  period?: "7d" | "30d" | "90d" | "custom";
  startDate?: string;
  endDate?: string;
}): ReportDateRange {
  const { start, end, periodLabel } = resolveDateRange({
    period: params.period,
    startDate: params.startDate,
    endDate: params.endDate,
  });
  return { start, end, label: periodLabel };
}

// ---------------------------------------------------------------------------
// 1. BOOKING REPORTS
// ---------------------------------------------------------------------------

export async function getBookingsReport(params: ReportQueryInput) {
  await connectToDatabase();

  const { start, end, label } = getReportDateRange({
    period: params.period,
    startDate: params.startDate,
    endDate: params.endDate,
  });

  // Base query: bookings whose startAt falls in the selected date range
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: any = {
    startAt: { $gte: start, $lte: end },
  };

  if (params.status && params.status !== "ALL") {
    query.status = params.status;
  }

  if (params.facilityId && mongoose.Types.ObjectId.isValid(params.facilityId)) {
    query.facility = new mongoose.Types.ObjectId(params.facilityId);
  }

  if (params.sportType && params.sportType !== "ALL") {
    const facilities = await Facility.find({ sportType: params.sportType as SportType })
      .select("_id")
      .lean();
    query.facility = { $in: facilities.map((f) => f._id) };
  }

  // Summary statistics for the date range
  const summaryAgg = await Booking.aggregate([
    { $match: { startAt: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        confirmed: {
          $sum: { $cond: [{ $eq: ["$status", "CONFIRMED"] }, 1, 0] },
        },
        cancelled: {
          $sum: { $cond: [{ $eq: ["$status", "CANCELLED"] }, 1, 0] },
        },
        rejected: {
          $sum: { $cond: [{ $eq: ["$status", "REJECTED"] }, 1, 0] },
        },
        completed: {
          $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] },
        },
        primeTime: {
          $sum: { $cond: [{ $eq: ["$bookingType", "PRIME_TIME"] }, 1, 0] },
        },
      },
    },
  ]);

  const summary = {
    total: summaryAgg[0]?.total || 0,
    confirmed: summaryAgg[0]?.confirmed || 0,
    cancelled: summaryAgg[0]?.cancelled || 0,
    rejected: summaryAgg[0]?.rejected || 0,
    completed: summaryAgg[0]?.completed || 0,
    primeTime: summaryAgg[0]?.primeTime || 0,
  };

  // CSV format: bounded query up to safe cap
  if (params.format === "csv") {
    const bookings = await Booking.find(query)
      .populate("user", "name email role")
      .populate("facility", "name sportType location")
      .sort({ startAt: -1 })
      .limit(5000)
      .lean();

    const headers = [
      "Booking ID",
      "Student Name",
      "Student Email",
      "User Role",
      "Facility Name",
      "Sport Type",
      "Booking Date",
      "Start Time",
      "End Time",
      "Booking Type",
      "Booking Status",
      "Cancellation Reason",
      "Created At",
    ];

    const rows = bookings.map((b) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const user = b.user as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const facility = b.facility as any;
      const bDate = b.bookingDate ? new Date(b.bookingDate).toISOString().split("T")[0] : "";

      return [
        b._id.toString(),
        user?.name || "Unknown",
        user?.email || "N/A",
        user?.role || "STUDENT",
        facility?.name || "Unknown Facility",
        facility?.sportType || "OTHER",
        bDate,
        b.startTime,
        b.endTime,
        b.bookingType,
        b.status,
        b.cancellationReason || "",
        b.createdAt,
      ];
    });

    const csvContent = generateCsvString(headers, rows);
    const filename = `courts-after-dark-bookings-${label}-${start.toISOString().split("T")[0]}-to-${end.toISOString().split("T")[0]}.csv`;
    return { format: "csv" as const, csvContent, filename };
  }

  // Preview format: paginated JSON
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));
  const skip = (page - 1) * limit;

  const [bookings, totalCount] = await Promise.all([
    Booking.find(query)
      .populate("user", "name email role")
      .populate("facility", "name sportType location")
      .sort({ startAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Booking.countDocuments(query),
  ]);

  return {
    format: "preview" as const,
    dateRange: { start: start.toISOString(), end: end.toISOString(), label },
    summary,
    pagination: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit) || 1,
    },
    data: bookings,
  };
}

// ---------------------------------------------------------------------------
// 2. FACILITY UTILIZATION REPORTS
// ---------------------------------------------------------------------------

export async function getFacilityUtilizationReport(params: ReportQueryInput) {
  await connectToDatabase();

  const { start, end, label } = getReportDateRange({
    period: params.period,
    startDate: params.startDate,
    endDate: params.endDate,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const facilityQuery: any = {};
  if (params.sportType && params.sportType !== "ALL") {
    facilityQuery.sportType = params.sportType;
  }
  if (params.facilityId && mongoose.Types.ObjectId.isValid(params.facilityId)) {
    facilityQuery._id = new mongoose.Types.ObjectId(params.facilityId);
  }

  const facilities = await Facility.find(facilityQuery).sort({ name: 1 }).lean<IFacility[]>();
  const daysInPeriod = Math.max(1, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  const utilizationRows = [];
  let totalConfirmedHoursAll = 0;
  let totalAvailableHoursAll = 0;

  for (const f of facilities) {
    const [openH, openM] = (f.operatingHours?.open || "06:00").split(":").map(Number);
    const [closeH, closeM] = (f.operatingHours?.close || "23:00").split(":").map(Number);

    let dailyMinutes = (closeH * 60 + closeM) - (openH * 60 + openM);
    if (dailyMinutes <= 0) dailyMinutes = 17 * 60;

    const dailyOperatingHours = dailyMinutes / 60;
    const availableOperatingHours = Math.round(dailyOperatingHours * daysInPeriod * 10) / 10;

    // Confirmed bookings in reporting window
    const bookings = await Booking.find({
      facility: f._id,
      status: { $in: ["CONFIRMED", "COMPLETED"] },
      startAt: { $lt: end },
      endAt: { $gt: start },
    })
      .select("startAt endAt")
      .lean<IBooking[]>();

    let confirmedMinutes = 0;
    for (const b of bookings) {
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

    totalConfirmedHoursAll += confirmedHours;
    totalAvailableHoursAll += availableOperatingHours;

    utilizationRows.push({
      facilityId: f._id.toString(),
      facilityName: f.name,
      sportType: f.sportType,
      location: f.location,
      operatingHours: `${f.operatingHours?.open || "06:00"} - ${f.operatingHours?.close || "23:00"}`,
      slotDuration: f.slotDuration || 60,
      confirmedBookingHours: confirmedHours,
      availableOperatingHours,
      utilizationPercentage,
    });
  }

  // Sort descending by utilization percentage
  utilizationRows.sort((a, b) => b.utilizationPercentage - a.utilizationPercentage);

  const averageCampusUtilization =
    totalAvailableHoursAll > 0
      ? Math.round((totalConfirmedHoursAll / totalAvailableHoursAll) * 1000) / 10
      : 0;

  const topFacility = utilizationRows[0] || null;

  const summary = {
    totalFacilities: facilities.length,
    averageUtilizationPercentage: averageCampusUtilization,
    totalConfirmedHours: Math.round(totalConfirmedHoursAll * 10) / 10,
    totalAvailableHours: Math.round(totalAvailableHoursAll * 10) / 10,
    topUtilizedFacility: topFacility
      ? `${topFacility.facilityName} (${topFacility.utilizationPercentage}%)`
      : "None",
  };

  if (params.format === "csv") {
    const headers = [
      "Facility Name",
      "Sport Type",
      "Location",
      "Operating Hours",
      "Slot Duration (mins)",
      "Confirmed Booking Hours",
      "Available Operating Hours",
      "Utilization Percentage",
    ];

    const rows = utilizationRows.map((r) => [
      r.facilityName,
      r.sportType,
      r.location,
      r.operatingHours,
      r.slotDuration,
      r.confirmedBookingHours,
      r.availableOperatingHours,
      `${r.utilizationPercentage}%`,
    ]);

    const csvContent = generateCsvString(headers, rows);
    const filename = `courts-after-dark-facility-utilization-${label}.csv`;
    return { format: "csv" as const, csvContent, filename };
  }

  // Preview format
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));
  const skip = (page - 1) * limit;
  const paginatedRows = utilizationRows.slice(skip, skip + limit);

  return {
    format: "preview" as const,
    dateRange: { start: start.toISOString(), end: end.toISOString(), label },
    summary,
    pagination: {
      total: utilizationRows.length,
      page,
      limit,
      totalPages: Math.ceil(utilizationRows.length / limit) || 1,
    },
    data: paginatedRows,
  };
}

// ---------------------------------------------------------------------------
// 3. EQUIPMENT REPORTS
// ---------------------------------------------------------------------------

export async function getEquipmentReport(params: ReportQueryInput) {
  await connectToDatabase();

  const { start, end, label } = getReportDateRange({
    period: params.period,
    startDate: params.startDate,
    endDate: params.endDate,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const equipQuery: any = {};
  if (params.sportType && params.sportType !== "ALL") {
    equipQuery.category = params.sportType;
  }
  if (params.status && params.status !== "ALL") {
    equipQuery.status = params.status;
  }

  const allEquip = await Equipment.find(equipQuery).sort({ name: 1 }).lean<IEquipment[]>();
  const now = new Date();

  // Aggregate checkout stats per equipment item
  const checkoutStats = await EquipmentCheckout.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end } } },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.equipment",
        totalCheckouts: { $sum: 1 },
      },
    },
  ]);

  const checkoutMap = new Map<string, number>();
  for (const c of checkoutStats) {
    if (c._id) checkoutMap.set(c._id.toString(), c.totalCheckouts);
  }

  // Aggregate overdue checkouts per equipment
  const overdueStats = await EquipmentCheckout.aggregate([
    {
      $match: {
        status: "ISSUED",
        expectedReturnAt: { $lt: now },
      },
    },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.equipment",
        overdueCount: { $sum: 1 },
      },
    },
  ]);

  const overdueMap = new Map<string, number>();
  for (const o of overdueStats) {
    if (o._id) overdueMap.set(o._id.toString(), o.overdueCount);
  }

  let totalInventoryUnits = 0;
  let totalAvailableUnits = 0;
  let totalIssuedUnits = 0;
  let totalDamagedUnits = 0;
  let totalOverdueAll = 0;

  const rows = allEquip.map((item) => {
    const totalQ = item.totalQuantity || 0;
    const availQ = item.availableQuantity || 0;
    const damQ = item.damagedQuantity || 0;
    const issuedQ = Math.max(0, totalQ - (availQ + damQ));
    const checkouts = checkoutMap.get(item._id.toString()) || 0;
    const overdue = overdueMap.get(item._id.toString()) || 0;

    totalInventoryUnits += totalQ;
    totalAvailableUnits += availQ;
    totalIssuedUnits += issuedQ;
    totalDamagedUnits += damQ;
    totalOverdueAll += overdue;

    return {
      _id: item._id.toString(),
      name: item.name,
      category: item.category,
      status: item.status,
      totalQuantity: totalQ,
      availableQuantity: availQ,
      issuedQuantity: issuedQ,
      damagedQuantity: damQ,
      totalCheckouts: checkouts,
      overdueCheckouts: overdue,
    };
  });

  const summary = {
    totalItemTypes: allEquip.length,
    totalUnits: totalInventoryUnits,
    availableUnits: totalAvailableUnits,
    issuedUnits: totalIssuedUnits,
    damagedUnits: totalDamagedUnits,
    overdueCheckouts: totalOverdueAll,
  };

  if (params.format === "csv") {
    const headers = [
      "Equipment Name",
      "Category",
      "Item Status",
      "Total Quantity",
      "Available Quantity",
      "Issued Quantity",
      "Damaged Quantity",
      "Checkouts in Period",
      "Current Overdue Count",
    ];

    const csvRows = rows.map((r) => [
      r.name,
      r.category,
      r.status,
      r.totalQuantity,
      r.availableQuantity,
      r.issuedQuantity,
      r.damagedQuantity,
      r.totalCheckouts,
      r.overdueCheckouts,
    ]);

    const csvContent = generateCsvString(headers, csvRows);
    const filename = `courts-after-dark-equipment-inventory-${label}.csv`;
    return { format: "csv" as const, csvContent, filename };
  }

  // Preview format
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));
  const skip = (page - 1) * limit;

  return {
    format: "preview" as const,
    dateRange: { start: start.toISOString(), end: end.toISOString(), label },
    summary,
    pagination: {
      total: rows.length,
      page,
      limit,
      totalPages: Math.ceil(rows.length / limit) || 1,
    },
    data: rows.slice(skip, skip + limit),
  };
}

// ---------------------------------------------------------------------------
// 4. MAINTENANCE REPORTS
// ---------------------------------------------------------------------------

export async function getMaintenanceReport(params: ReportQueryInput) {
  await connectToDatabase();

  const { start, end, label } = getReportDateRange({
    period: params.period,
    startDate: params.startDate,
    endDate: params.endDate,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: any = {
    startAt: { $lt: end },
    endAt: { $gt: start },
  };

  if (params.status && params.status !== "ALL") {
    query.status = params.status;
  }

  if (params.facilityId && mongoose.Types.ObjectId.isValid(params.facilityId)) {
    query.facility = new mongoose.Types.ObjectId(params.facilityId);
  }

  // Summary statistics for maintenance in window
  const summaryAgg = await Maintenance.aggregate([
    {
      $match: {
        startAt: { $lt: end },
        endAt: { $gt: start },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        scheduled: {
          $sum: { $cond: [{ $eq: ["$status", "SCHEDULED"] }, 1, 0] },
        },
        inProgress: {
          $sum: { $cond: [{ $eq: ["$status", "IN_PROGRESS"] }, 1, 0] },
        },
        completed: {
          $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] },
        },
        cancelled: {
          $sum: { $cond: [{ $eq: ["$status", "CANCELLED"] }, 1, 0] },
        },
      },
    },
  ]);

  const summary = {
    total: summaryAgg[0]?.total || 0,
    scheduled: summaryAgg[0]?.scheduled || 0,
    inProgress: summaryAgg[0]?.inProgress || 0,
    completed: summaryAgg[0]?.completed || 0,
    cancelled: summaryAgg[0]?.cancelled || 0,
  };

  if (params.format === "csv") {
    const records = await Maintenance.find(query)
      .populate("facility", "name sportType location")
      .populate("createdBy", "name email")
      .sort({ startAt: -1 })
      .limit(5000)
      .lean();

    const headers = [
      "Maintenance ID",
      "Facility Name",
      "Sport Type",
      "Location",
      "Reason",
      "Start Date & Time",
      "End Date & Time",
      "Status",
      "Created By (Email)",
      "Created At",
    ];

    const csvRows = records.map((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = m.facility as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const admin = m.createdBy as any;

      return [
        m._id.toString(),
        f?.name || "Unknown Facility",
        f?.sportType || "OTHER",
        f?.location || "Campus",
        m.reason,
        m.startAt,
        m.endAt,
        m.status,
        admin?.email || "Admin",
        m.createdAt,
      ];
    });

    const csvContent = generateCsvString(headers, csvRows);
    const filename = `courts-after-dark-maintenance-${label}.csv`;
    return { format: "csv" as const, csvContent, filename };
  }

  // Preview format
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));
  const skip = (page - 1) * limit;

  const [records, totalCount] = await Promise.all([
    Maintenance.find(query)
      .populate("facility", "name sportType location")
      .populate("createdBy", "name email")
      .sort({ startAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Maintenance.countDocuments(query),
  ]);

  return {
    format: "preview" as const,
    dateRange: { start: start.toISOString(), end: end.toISOString(), label },
    summary,
    pagination: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit) || 1,
    },
    data: records,
  };
}

// ---------------------------------------------------------------------------
// 5. USER REGISTRATION REPORTS
// ---------------------------------------------------------------------------

export async function getUserRegistrationReport(params: ReportQueryInput) {
  await connectToDatabase();

  const { start, end, label } = getReportDateRange({
    period: params.period,
    startDate: params.startDate,
    endDate: params.endDate,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: any = {
    createdAt: { $gte: start, $lte: end },
  };

  if (params.role && params.role !== "ALL") {
    query.role = params.role as UserRole;
  }

  if (params.accountStatus && params.accountStatus !== "ALL") {
    query.isActive = params.accountStatus === "ACTIVE";
  }

  // Summary statistics for registrations in date range
  const summaryAgg = await User.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        students: {
          $sum: { $cond: [{ $eq: ["$role", "STUDENT"] }, 1, 0] },
        },
        teachers: {
          $sum: { $cond: [{ $eq: ["$role", "TEACHER"] }, 1, 0] },
        },
        admins: {
          $sum: { $cond: [{ $eq: ["$role", "ADMIN"] }, 1, 0] },
        },
        equipmentManagers: {
          $sum: { $cond: [{ $eq: ["$role", "EQUIPMENT_MANAGER"] }, 1, 0] },
        },
        active: {
          $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] },
        },
        inactive: {
          $sum: { $cond: [{ $eq: ["$isActive", false] }, 1, 0] },
        },
      },
    },
  ]);

  const summary = {
    total: summaryAgg[0]?.total || 0,
    students: summaryAgg[0]?.students || 0,
    teachers: summaryAgg[0]?.teachers || 0,
    admins: summaryAgg[0]?.admins || 0,
    equipmentManagers: summaryAgg[0]?.equipmentManagers || 0,
    active: summaryAgg[0]?.active || 0,
    inactive: summaryAgg[0]?.inactive || 0,
  };

  // EXCLUDE password, token, or any sensitive hash field from projection
  const safeProjection = "name email phoneNumber role isActive createdAt";

  if (params.format === "csv") {
    const users = await User.find(query)
      .select(safeProjection)
      .sort({ createdAt: -1 })
      .limit(5000)
      .lean<IUser[]>();

    const headers = [
      "User Name",
      "Email Address",
      "Phone Number",
      "Role",
      "Account Status",
      "Registration Date",
    ];

    const csvRows = users.map((u) => [
      u.name,
      u.email,
      u.phoneNumber || "N/A",
      u.role,
      u.isActive ? "ACTIVE" : "INACTIVE",
      u.createdAt,
    ]);

    const csvContent = generateCsvString(headers, csvRows);
    const filename = `courts-after-dark-users-${label}.csv`;
    return { format: "csv" as const, csvContent, filename };
  }

  // Preview format
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));
  const skip = (page - 1) * limit;

  const [users, totalCount] = await Promise.all([
    User.find(query)
      .select(safeProjection)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean<IUser[]>(),
    User.countDocuments(query),
  ]);

  return {
    format: "preview" as const,
    dateRange: { start: start.toISOString(), end: end.toISOString(), label },
    summary,
    pagination: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit) || 1,
    },
    data: users,
  };
}
