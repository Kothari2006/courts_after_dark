import mongoose, { Schema, Document, Model, Types } from "mongoose";
import { SportType } from "./Facility";

export type ActivityStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type ActivityAttendanceStatus = "REGISTERED" | "PRESENT" | "ABSENT";

export interface IActivityParticipant {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  joinedAt: Date;
  attendanceStatus: ActivityAttendanceStatus;
  markedAt?: Date | null;
  markedBy?: Types.ObjectId | null;
}

export interface IActivity extends Document {
  title: string;
  description?: string;
  sportType: SportType;
  facility: Types.ObjectId;
  createdBy: Types.ObjectId;
  startAt: Date;
  endAt: Date;
  participantLimit: number;
  participants: IActivityParticipant[];
  status: ActivityStatus;
  cancellationReason?: string;
  cancelledAt?: Date | null;
  cancelledBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const ActivityParticipantSchema = new Schema<IActivityParticipant>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Participant user reference is required"],
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    attendanceStatus: {
      type: String,
      enum: {
        values: ["REGISTERED", "PRESENT", "ABSENT"],
        message: "{VALUE} is not a valid attendance status",
      },
      default: "REGISTERED",
    },
    markedAt: {
      type: Date,
      default: null,
    },
    markedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { _id: true }
);

const ActivitySchema = new Schema<IActivity>(
  {
    title: {
      type: String,
      required: [true, "Activity title is required"],
      trim: true,
      maxlength: [120, "Title cannot exceed 120 characters"],
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
      default: "",
    },
    sportType: {
      type: String,
      required: [true, "Sport type is required"],
      enum: {
        values: [
          "BADMINTON",
          "BASKETBALL",
          "FOOTBALL",
          "CRICKET",
          "TENNIS",
          "GYM",
          "OTHER",
        ],
        message: "{VALUE} is not a valid sport type",
      },
      index: true,
    },
    facility: {
      type: Schema.Types.ObjectId,
      ref: "Facility",
      required: [true, "Facility reference is required"],
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator reference (Teacher) is required"],
      index: true,
    },
    startAt: {
      type: Date,
      required: [true, "Start timestamp is required"],
      index: true,
    },
    endAt: {
      type: Date,
      required: [true, "End timestamp is required"],
      index: true,
      validate: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        validator: function (this: any, value: Date) {
          return this.startAt ? value > this.startAt : true;
        },
        message: "End timestamp (endAt) must be strictly after start timestamp (startAt)",
      },
    },
    participantLimit: {
      type: Number,
      required: [true, "Participant limit is required"],
      min: [1, "Participant limit must be at least 1"],
      max: [200, "Participant limit cannot exceed 200"],
      default: 20,
    },
    participants: {
      type: [ActivityParticipantSchema],
      default: [],
    },
    status: {
      type: String,
      enum: {
        values: ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
        message: "{VALUE} is not a valid activity status",
      },
      default: "SCHEDULED",
      index: true,
    },
    cancellationReason: {
      type: String,
      trim: true,
      maxlength: [500, "Cancellation reason cannot exceed 500 characters"],
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for conflict lookups & teacher queries
ActivitySchema.index({ facility: 1, startAt: 1, endAt: 1 });
ActivitySchema.index({ facility: 1, status: 1 });
ActivitySchema.index({ createdBy: 1, startAt: -1 });

const Activity: Model<IActivity> =
  mongoose.models.Activity || mongoose.model<IActivity>("Activity", ActivitySchema);

export default Activity;
