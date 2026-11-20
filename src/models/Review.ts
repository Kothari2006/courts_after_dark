import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface IReviewModerationHistory {
  admin: Types.ObjectId;
  previousStatus: ReviewStatus;
  newStatus: ReviewStatus;
  reason?: string;
  timestamp: Date;
}

export interface IReview extends Document {
  user: Types.ObjectId;
  facility: Types.ObjectId;
  booking: Types.ObjectId;
  rating: number; // 1 to 5
  title?: string;
  comment: string;
  status: ReviewStatus;
  moderatedBy?: Types.ObjectId | null;
  moderationReason?: string | null;
  moderatedAt?: Date | null;
  moderationHistory: IReviewModerationHistory[];
  createdAt: Date;
  updatedAt: Date;
}

const ReviewModerationHistorySchema = new Schema<IReviewModerationHistory>(
  {
    admin: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    previousStatus: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      required: true,
    },
    newStatus: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      required: true,
    },
    reason: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const ReviewSchema = new Schema<IReview>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      index: true,
    },
    facility: {
      type: Schema.Types.ObjectId,
      ref: "Facility",
      required: [true, "Facility reference is required"],
      index: true,
    },
    booking: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: [true, "Booking reference is required"],
      unique: true, // One review per completed booking
      index: true,
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
      validate: {
        validator: Number.isInteger,
        message: "Rating must be an integer between 1 and 5",
      },
      index: true,
    },
    title: {
      type: String,
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
      default: "",
    },
    comment: {
      type: String,
      required: [true, "Review comment is required"],
      trim: true,
      minlength: [5, "Comment must be at least 5 characters"],
      maxlength: [1000, "Comment cannot exceed 1000 characters"],
    },
    status: {
      type: String,
      enum: {
        values: ["PENDING", "APPROVED", "REJECTED"],
        message: "{VALUE} is not a valid review status",
      },
      default: "PENDING",
      index: true,
    },
    moderatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    moderationReason: {
      type: String,
      trim: true,
      maxlength: [500, "Moderation reason cannot exceed 500 characters"],
      default: null,
    },
    moderatedAt: {
      type: Date,
      default: null,
    },
    moderationHistory: {
      type: [ReviewModerationHistorySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for public facility reviews & user reviews
ReviewSchema.index({ facility: 1, status: 1, createdAt: -1 });
ReviewSchema.index({ user: 1, createdAt: -1 });
ReviewSchema.index({ status: 1, createdAt: -1 });

const Review: Model<IReview> =
  mongoose.models.Review || mongoose.model<IReview>("Review", ReviewSchema);

export default Review;

