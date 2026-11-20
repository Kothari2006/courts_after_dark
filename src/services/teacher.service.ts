import connectToDatabase from "@/lib/mongodb";
import Booking from "@/models/Booking";
import Facility from "@/models/Facility";
import Activity from "@/models/Activity";
import Maintenance from "@/models/Maintenance";
import MaintenanceReport from "@/models/MaintenanceReport";
import Equipment from "@/models/Equipment";
void Equipment;
import { Types } from "mongoose";

export async function getTeacherOverviewStats(teacherId: string) {
  await connectToDatabase();

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const [
    todayActivitiesCount,
    myTotalActivitiesCount,
    upcomingActivities,
    recentStudentBookings,
    totalActiveFacilities,
  ] = await Promise.all([
    // Today's activities
    Activity.countDocuments({
      status: { $in: ["SCHEDULED", "IN_PROGRESS"] },
      startAt: { $gte: startOfToday, $lte: endOfToday },
    }),

    // Teacher's total created activities
    Activity.countDocuments({
      createdBy: new Types.ObjectId(teacherId),
    }),

    // Upcoming events/activities
    Activity.find({
      status: { $in: ["SCHEDULED", "IN_PROGRESS"] },
      startAt: { $gte: now },
    })
      .populate("facility", "name sportType location")
      .populate("createdBy", "name")
      .sort({ startAt: 1 })
      .limit(5)
      .lean(),

    // Recent student bookings across all facilities
    Booking.find({
      status: { $in: ["CONFIRMED", "COMPLETED"] },
    })
      .populate("user", "name email")
      .populate("facility", "name sportType")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),

    // Total active facilities
    Facility.countDocuments({ status: "ACTIVE" }),
  ]);

  return {
    todayActivitiesCount,
    myTotalActivitiesCount,
    totalActiveFacilities,
    upcomingActivities,
    recentStudentBookings,
  };
}

export interface TeacherBookingFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  facilityId?: string;
  sportType?: string;
  date?: string;
  status?: string;
}

export async function getStudentBookingsForTeacher(params: TeacherBookingFilterParams = {}) {
  await connectToDatabase();

  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));
  const skip = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: any = {};

  if (params.status && params.status !== "ALL") {
    filter.status = params.status;
  }

  if (params.facilityId) {
    filter.facility = new Types.ObjectId(params.facilityId);
  }

  if (params.date) {
    const targetDate = new Date(params.date);
    const dayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const dayEnd = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);
    filter.bookingDate = { $gte: dayStart, $lte: dayEnd };
  }

  // If search query provided, search User by name or email
  if (params.search) {
    const searchRegex = new RegExp(params.search.trim(), "i");
    const User = (await import("@/models/User")).default;
    const matchingUsers = await User.find({
      $or: [{ name: searchRegex }, { email: searchRegex }],
    }).select("_id");

    const userIds = matchingUsers.map((u) => u._id);

    // Also match facility name or booking ID if valid ObjectId
    const matchingFacilities = await Facility.find({
      name: searchRegex,
    }).select("_id");

    const facilityIds = matchingFacilities.map((f) => f._id);

    const orClauses: any[] = [{ user: { $in: userIds } }, { facility: { $in: facilityIds } }];

    if (Types.ObjectId.isValid(params.search.trim())) {
      orClauses.push({ _id: new Types.ObjectId(params.search.trim()) });
    }

    filter.$or = orClauses;
  }

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate("user", "name email role")
      .populate("facility", "name sportType location")
      .sort({ startAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Booking.countDocuments(filter),
  ]);

  // Filter sportType in-memory if populated facility sportType requested
  let filteredBookings = bookings;
  if (params.sportType && params.sportType !== "ALL") {
    filteredBookings = bookings.filter(
      (b: any) => b.facility?.sportType === params.sportType
    );
  }

  return {
    bookings: filteredBookings,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function getFacilityScheduleForTeacher(facilityId: string, dateStr: string) {
  await connectToDatabase();

  const facility = await Facility.findById(facilityId).lean();
  if (!facility) {
    throw new Error("Facility not found");
  }

  const selectedDate = new Date(dateStr);
  const dayStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
  const dayEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 23, 59, 59, 999);

  // Fetch confirmed/pending bookings for this facility and day
  const bookings = await Booking.find({
    facility: new Types.ObjectId(facilityId),
    status: { $in: ["CONFIRMED", "PENDING"] },
    startAt: { $lt: dayEnd },
    endAt: { $gt: dayStart },
  })
    .select("startAt endAt startTime endTime status bookingType")
    .lean();

  // Fetch maintenance schedules
  const maintenance = await Maintenance.find({
    facility: new Types.ObjectId(facilityId),
    status: { $in: ["SCHEDULED", "IN_PROGRESS"] },
    startAt: { $lt: dayEnd },
    endAt: { $gt: dayStart },
  })
    .select("startAt endAt reason status")
    .lean();

  // Fetch activities
  const activities = await Activity.find({
    facility: new Types.ObjectId(facilityId),
    status: { $in: ["SCHEDULED", "IN_PROGRESS"] },
    startAt: { $lt: dayEnd },
    endAt: { $gt: dayStart },
  })
    .select("title sportType startAt endAt participantLimit participants status")
    .populate("createdBy", "name")
    .lean();

  // Return privacy-preserving schedule
  return {
    facility: {
      _id: facility._id,
      name: facility.name,
      sportType: facility.sportType,
      location: facility.location,
      operatingHours: facility.operatingHours,
      slotDuration: facility.slotDuration,
    },
    date: dateStr,
    bookings: bookings.map((b) => ({
      _id: b._id,
      startAt: b.startAt,
      endAt: b.endAt,
      startTime: b.startTime,
      endTime: b.endTime,
      status: b.status,
      bookingType: b.bookingType,
      // No student name or email is exposed here for privacy
    })),
    maintenance: maintenance.map((m) => ({
      _id: m._id,
      startAt: m.startAt,
      endAt: m.endAt,
      reason: m.reason,
      status: m.status,
    })),
    activities: activities.map((a: any) => ({
      _id: a._id,
      title: a.title,
      sportType: a.sportType,
      startAt: a.startAt,
      endAt: a.endAt,
      organizer: a.createdBy?.name || "Faculty",
      participantCount: a.participants?.length || 0,
      participantLimit: a.participantLimit,
      status: a.status,
    })),
  };
}

export interface CreateReportInput {
  type: "FACILITY" | "EQUIPMENT";
  facilityId?: string | null;
  equipmentId?: string | null;
  title: string;
  description: string;
  severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export async function createTeacherMaintenanceReport(
  input: CreateReportInput,
  teacherId: string
) {
  await connectToDatabase();

  const report = await MaintenanceReport.create({
    reporter: new Types.ObjectId(teacherId),
    type: input.type,
    facility: input.facilityId ? new Types.ObjectId(input.facilityId) : null,
    equipment: input.equipmentId ? new Types.ObjectId(input.equipmentId) : null,
    title: input.title.trim(),
    description: input.description.trim(),
    severity: input.severity || "MEDIUM",
    status: "PENDING",
  });

  return report;
}

export async function getTeacherMaintenanceReports(
  teacherId: string,
  params: { page?: number; limit?: number; status?: string; type?: string } = {}
) {
  await connectToDatabase();

  const page = Math.max(1, params.page || 1);
  const limit = Math.min(50, Math.max(1, params.limit || 20));
  const skip = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: any = {
    reporter: new Types.ObjectId(teacherId),
  };

  if (params.status && params.status !== "ALL") {
    filter.status = params.status;
  }

  if (params.type && params.type !== "ALL") {
    filter.type = params.type;
  }

  const [reports, total] = await Promise.all([
    MaintenanceReport.find(filter)
      .populate("facility", "name sportType location")
      .populate("equipment", "name category")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    MaintenanceReport.countDocuments(filter),
  ]);

  return {
    reports,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}
