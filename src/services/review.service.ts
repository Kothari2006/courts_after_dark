import connectToDatabase from "@/lib/mongodb";
import Review, { IReview, ReviewStatus } from "@/models/Review";
import Booking from "@/models/Booking";
import Facility from "@/models/Facility";
import User from "@/models/User";
import { Types } from "mongoose";

export class ReviewEligibilityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReviewEligibilityError";
  }
}

export class DuplicateReviewError extends Error {
  constructor(message: string = "This booking has already been reviewed") {
    super(message);
    this.name = "DuplicateReviewError";
  }
}

export class ReviewNotFoundError extends Error {
  constructor(message: string = "Review not found") {
    super(message);
    this.name = "ReviewNotFoundError";
  }
}

export interface CreateReviewInput {
  bookingId: string;
  rating: number;
  title?: string;
  comment: string;
}

/**
 * Creates a review for a completed booking owned by the authenticated student.
 */
export async function createReview(
  input: CreateReviewInput,
  userId: string
): Promise<IReview> {
  await connectToDatabase();

  const booking = await Booking.findById(input.bookingId);
  if (!booking) {
    throw new ReviewEligibilityError("Booking not found");
  }

  // 1. Verify ownership
  if (booking.user.toString() !== userId) {
    throw new ReviewEligibilityError("You can only review your own bookings");
  }

  // 2. Verify booking is COMPLETED
  if (booking.status !== "COMPLETED") {
    throw new ReviewEligibilityError(
      `Only completed bookings can be reviewed. This booking is currently ${booking.status.toLowerCase()}`
    );
  }

  // 3. Verify no duplicate review exists
  const existingReview = await Review.findOne({ booking: booking._id });
  if (existingReview) {
    throw new DuplicateReviewError("You have already submitted a review for this booking");
  }

  const review = await Review.create({
    user: new Types.ObjectId(userId),
    facility: booking.facility,
    booking: booking._id,
    rating: input.rating,
    title: input.title?.trim() || "",
    comment: input.comment.trim(),
    status: "PENDING",
  });

  return review;
}

export interface FacilityReviewsSummary {
  facility: {
    _id: string;
    name: string;
    sportType: string;
  } | null;
  averageRating: number | null;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  reviews: Array<{
    _id: string;
    rating: number;
    title?: string;
    comment: string;
    createdAt: string;
    reviewerName: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Returns public approved reviews and aggregate rating metrics for a facility.
 * Pending and rejected reviews are strictly excluded.
 */
export async function getFacilityReviews(
  facilityId: string,
  page = 1,
  limit = 10
): Promise<FacilityReviewsSummary> {
  await connectToDatabase();

  const facilityObjectId = new Types.ObjectId(facilityId);
  const facility = await Facility.findById(facilityId).select("name sportType").lean();

  const pageNum = Math.max(1, page);
  const limitNum = Math.min(50, Math.max(1, limit));
  const skip = (pageNum - 1) * limitNum;

  // Aggregate approved reviews for rating metrics
  const [metricsResult, reviewsResult, totalApproved] = await Promise.all([
    Review.aggregate([
      { $match: { facility: facilityObjectId, status: "APPROVED" } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$rating" },
          count: { $sum: 1 },
          star5: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } },
          star4: { $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] } },
          star3: { $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] } },
          star2: { $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] } },
          star1: { $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] } },
        },
      },
    ]),

    Review.find({ facility: facilityObjectId, status: "APPROVED" })
      .populate("user", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),

    Review.countDocuments({ facility: facilityObjectId, status: "APPROVED" }),
  ]);

  const metrics = metricsResult[0];
  const averageRating = metrics ? Math.round(metrics.avgRating * 10) / 10 : null;

  const ratingDistribution = {
    5: metrics?.star5 || 0,
    4: metrics?.star4 || 0,
    3: metrics?.star3 || 0,
    2: metrics?.star2 || 0,
    1: metrics?.star1 || 0,
  };

  const safeReviews = reviewsResult.map((r: any) => ({
    _id: r._id.toString(),
    rating: r.rating,
    title: r.title,
    comment: r.comment,
    createdAt: r.createdAt.toISOString(),
    reviewerName: r.user?.name || "Anonymous Student",
  }));

  return {
    facility: facility ? { _id: facility._id.toString(), name: facility.name, sportType: facility.sportType } : null,
    averageRating,
    totalReviews: totalApproved,
    ratingDistribution,
    reviews: safeReviews,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: totalApproved,
      totalPages: Math.ceil(totalApproved / limitNum) || 1,
    },
  };
}

/**
 * Returns reviews submitted by the authenticated user across all statuses.
 */
export async function getUserReviews(userId: string, page = 1, limit = 20) {
  await connectToDatabase();

  const pageNum = Math.max(1, page);
  const limitNum = Math.min(50, Math.max(1, limit));
  const skip = (pageNum - 1) * limitNum;

  const filter = { user: new Types.ObjectId(userId) };

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate("facility", "name sportType location")
      .populate("booking", "bookingDate startTime endTime")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Review.countDocuments(filter),
  ]);

  return {
    reviews,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  };
}

/**
 * Finds completed bookings for the student that do not yet have a review.
 */
export async function getEligibleBookingsForReview(userId: string) {
  await connectToDatabase();

  const userObjId = new Types.ObjectId(userId);

  // 1. Get IDs of bookings already reviewed by this user
  const existingReviews = await Review.find({ user: userObjId }).select("booking").lean();
  const reviewedBookingIds = existingReviews.map((r) => r.booking);

  // 2. Find completed bookings not in reviewedBookingIds
  const eligibleBookings = await Booking.find({
    user: userObjId,
    status: "COMPLETED",
    _id: { $nin: reviewedBookingIds },
  })
    .populate("facility", "name sportType location")
    .sort({ bookingDate: -1 })
    .limit(20)
    .lean();

  return eligibleBookings;
}

export interface AdminReviewFilterParams {
  page?: number;
  limit?: number;
  status?: string;
  facilityId?: string;
  search?: string;
}

/**
 * Returns reviews for admin moderation with summary counts.
 */
export async function getAdminReviews(params: AdminReviewFilterParams = {}) {
  await connectToDatabase();

  const pageNum = Math.max(1, params.page || 1);
  const limitNum = Math.min(100, Math.max(1, params.limit || 20));
  const skip = (pageNum - 1) * limitNum;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: any = {};

  if (params.status && params.status !== "ALL") {
    filter.status = params.status;
  }

  if (params.facilityId) {
    filter.facility = new Types.ObjectId(params.facilityId);
  }

  if (params.search) {
    const searchRegex = new RegExp(params.search.trim(), "i");
    const [matchingUsers, matchingFacilities] = await Promise.all([
      User.find({ $or: [{ name: searchRegex }, { email: searchRegex }] }).select("_id"),
      Facility.find({ name: searchRegex }).select("_id"),
    ]);

    const userIds = matchingUsers.map((u) => u._id);
    const facilityIds = matchingFacilities.map((f) => f._id);

    filter.$or = [
      { user: { $in: userIds } },
      { facility: { $in: facilityIds } },
      { title: searchRegex },
      { comment: searchRegex },
    ];
  }

  const [reviews, total, counts] = await Promise.all([
    Review.find(filter)
      .populate("user", "name email")
      .populate("facility", "name sportType location")
      .populate("booking", "bookingDate startTime endTime")
      .populate("moderatedBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),

    Review.countDocuments(filter),

    Promise.all([
      Review.countDocuments(),
      Review.countDocuments({ status: "PENDING" }),
      Review.countDocuments({ status: "APPROVED" }),
      Review.countDocuments({ status: "REJECTED" }),
    ]),
  ]);

  return {
    reviews,
    counts: {
      total: counts[0],
      pending: counts[1],
      approved: counts[2],
      rejected: counts[3],
    },
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  };
}

/**
 * Moderates a review (approve or reject with audit history).
 */
export async function moderateReview(
  reviewId: string,
  status: "APPROVED" | "REJECTED",
  reason: string | undefined,
  adminId: string
) {
  await connectToDatabase();

  const review = await Review.findById(reviewId);
  if (!review) {
    throw new ReviewNotFoundError();
  }

  const previousStatus = review.status;
  const adminObjId = new Types.ObjectId(adminId);
  const now = new Date();

  review.status = status;
  review.moderatedBy = adminObjId;
  review.moderatedAt = now;
  review.moderationReason = reason || null;

  review.moderationHistory.push({
    admin: adminObjId,
    previousStatus,
    newStatus: status,
    reason: reason || "",
    timestamp: now,
  });

  await review.save();
  return review;
}

