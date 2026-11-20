import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type NotificationType =
  | "BOOKING_CONFIRMED"
  | "BOOKING_CANCELLED"
  | "BOOKING_REJECTED"
  | "BOOKING_COMPLETED"
  | "WAITLIST_JOINED"
  | "WAITLIST_PROMOTED"
  | "EQUIPMENT_REQUEST_APPROVED"
  | "EQUIPMENT_REQUEST_REJECTED"
  | "EQUIPMENT_ISSUED"
  | "EQUIPMENT_RETURN_REMINDER"
  | "EQUIPMENT_OVERDUE"
  | "MAINTENANCE_SCHEDULED"
  | "MAINTENANCE_UPDATED"
  | "EVENT_PUBLISHED"
  | "EVENT_REGISTRATION_CONFIRMED"
  | "EVENT_REGISTRATION_CANCELLED"
  | "EVENT_CANCELLED"
  | "EVENT_TIMING_CHANGED"
  | "TOURNAMENT_SCHEDULE_PUBLISHED"
  | "GENERAL";

export type RelatedEntityType =
  | "BOOKING"
  | "EQUIPMENT_CHECKOUT"
  | "MAINTENANCE"
  | "WAITLIST"
  | "FACILITY"
  | "USER"
  | "EVENT";

export interface INotification extends Document {
  user: Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  relatedEntityType?: RelatedEntityType;
  relatedEntityId?: Types.ObjectId;
  isRead: boolean;
  readAt?: Date | null;
  link?: string;
  idempotencyKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      maxlength: [500, "Message cannot exceed 500 characters"],
    },
    type: {
      type: String,
      enum: {
        values: [
          "BOOKING_CONFIRMED",
          "BOOKING_CANCELLED",
          "BOOKING_REJECTED",
          "BOOKING_COMPLETED",
          "WAITLIST_JOINED",
          "WAITLIST_PROMOTED",
          "EQUIPMENT_REQUEST_APPROVED",
          "EQUIPMENT_REQUEST_REJECTED",
          "EQUIPMENT_ISSUED",
          "EQUIPMENT_RETURN_REMINDER",
          "EQUIPMENT_OVERDUE",
          "MAINTENANCE_SCHEDULED",
          "MAINTENANCE_UPDATED",
          "EVENT_PUBLISHED",
          "EVENT_REGISTRATION_CONFIRMED",
          "EVENT_REGISTRATION_CANCELLED",
          "EVENT_CANCELLED",
          "EVENT_TIMING_CHANGED",
          "TOURNAMENT_SCHEDULE_PUBLISHED",
          "GENERAL",
        ],
        message: "{VALUE} is not a valid notification type",
      },
      required: [true, "Notification type is required"],
      index: true,
    },
    relatedEntityType: {
      type: String,
      enum: [
        "BOOKING",
        "EQUIPMENT_CHECKOUT",
        "MAINTENANCE",
        "WAITLIST",
        "FACILITY",
        "USER",
        "EVENT",
      ],
      default: undefined,
    },
    relatedEntityId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    link: {
      type: String,
      trim: true,
      default: null,
    },
    idempotencyKey: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

// High performance compound indexes for user feed & badge queries
NotificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ user: 1, createdAt: -1 });

export const Notification: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", NotificationSchema);

export default Notification;

