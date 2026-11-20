import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type MaintenanceStatus =
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export interface IMaintenance extends Document {
  facility: Types.ObjectId;
  startAt: Date;
  endAt: Date;
  reason: string;
  notes?: string;
  status: MaintenanceStatus;
  createdBy: Types.ObjectId;
  cancelledBy?: Types.ObjectId;
  cancelledAt?: Date;
  cancellationReason?: string;
  completedBy?: Types.ObjectId;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MaintenanceSchema = new Schema<IMaintenance>(
  {
    facility: {
      type: Schema.Types.ObjectId,
      ref: "Facility",
      required: [true, "Facility reference is required"],
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
    reason: {
      type: String,
      required: [true, "Reason is required"],
      trim: true,
      maxlength: [500, "Reason cannot exceed 500 characters"],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, "Notes cannot exceed 1000 characters"],
    },
    status: {
      type: String,
      enum: {
        values: ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
        message: "{VALUE} is not a valid maintenance status",
      },
      default: "SCHEDULED",
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "CreatedBy (User) reference is required"],
      index: true,
    },
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: undefined,
    },
    cancelledAt: {
      type: Date,
      default: undefined,
    },
    cancellationReason: {
      type: String,
      trim: true,
      maxlength: [500, "Cancellation reason cannot exceed 500 characters"],
      default: undefined,
    },
    completedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: undefined,
    },
    completedAt: {
      type: Date,
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

MaintenanceSchema.index({ facility: 1, startAt: 1, endAt: 1, status: 1 });

export const Maintenance: Model<IMaintenance> =
  mongoose.models.Maintenance ||
  mongoose.model<IMaintenance>("Maintenance", MaintenanceSchema);

export default Maintenance;
