import mongoose, { Document, Model, Schema, Types } from "mongoose";
import { ActivityAttendanceStatus, ActivityStatus } from "./Activity";

interface IDemoActivityParticipant {
  user: Types.ObjectId;
  joinedAt: Date;
  attendanceStatus: ActivityAttendanceStatus;
}

export interface IDemoActivity extends Document {
  title: string;
  description: string;
  sportType: string;
  facilityId: string;
  createdBy: Types.ObjectId;
  startAt: Date;
  endAt: Date;
  participantLimit: number;
  participants: IDemoActivityParticipant[];
  status: ActivityStatus;
  cancellationReason?: string;
  cancelledAt?: Date | null;
  cancelledBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const DemoActivitySchema = new Schema<IDemoActivity>(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1000, default: "" },
    sportType: { type: String, required: true },
    facilityId: { type: String, required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    startAt: { type: Date, required: true, index: true },
    endAt: { type: Date, required: true },
    participantLimit: { type: Number, required: true, min: 1, max: 200 },
    participants: {
      type: [
        new Schema(
          {
            user: { type: Schema.Types.ObjectId, ref: "User", required: true },
            joinedAt: { type: Date, default: Date.now },
            attendanceStatus: {
              type: String,
              enum: ["REGISTERED", "PRESENT", "ABSENT"],
              default: "REGISTERED",
            },
          },
          { _id: true }
        ),
      ],
      default: [],
    },
    status: {
      type: String,
      enum: ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
      default: "SCHEDULED",
      index: true,
    },
    cancellationReason: { type: String, default: null },
    cancelledAt: { type: Date, default: null },
    cancelledBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

DemoActivitySchema.index({ facilityId: 1, startAt: 1, endAt: 1 });

export const DemoActivity: Model<IDemoActivity> =
  mongoose.models.DemoActivity ||
  mongoose.model<IDemoActivity>("DemoActivity", DemoActivitySchema);

export default DemoActivity;
