import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type MaintenanceReportType = "FACILITY" | "EQUIPMENT";
export type MaintenanceReportSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type MaintenanceReportStatus = "PENDING" | "ACKNOWLEDGED" | "RESOLVED";

export interface IMaintenanceReport extends Document {
  reporter: Types.ObjectId;
  type: MaintenanceReportType;
  facility?: Types.ObjectId | null;
  equipment?: Types.ObjectId | null;
  title: string;
  description: string;
  severity: MaintenanceReportSeverity;
  status: MaintenanceReportStatus;
  adminNotes?: string | null;
  resolvedAt?: Date | null;
  resolvedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const MaintenanceReportSchema = new Schema<IMaintenanceReport>(
  {
    reporter: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Reporter reference is required"],
      index: true,
    },
    type: {
      type: String,
      enum: {
        values: ["FACILITY", "EQUIPMENT"],
        message: "{VALUE} is not a valid report type",
      },
      required: [true, "Report type is required"],
      index: true,
    },
    facility: {
      type: Schema.Types.ObjectId,
      ref: "Facility",
      default: null,
      index: true,
    },
    equipment: {
      type: Schema.Types.ObjectId,
      ref: "Equipment",
      default: null,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Report title is required"],
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    description: {
      type: String,
      required: [true, "Report description is required"],
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    severity: {
      type: String,
      enum: {
        values: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
        message: "{VALUE} is not a valid severity",
      },
      default: "MEDIUM",
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ["PENDING", "ACKNOWLEDGED", "RESOLVED"],
        message: "{VALUE} is not a valid report status",
      },
      default: "PENDING",
      index: true,
    },
    adminNotes: {
      type: String,
      trim: true,
      maxlength: [1000, "Admin notes cannot exceed 1000 characters"],
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

MaintenanceReportSchema.index({ reporter: 1, createdAt: -1 });

const MaintenanceReport: Model<IMaintenanceReport> =
  mongoose.models.MaintenanceReport ||
  mongoose.model<IMaintenanceReport>("MaintenanceReport", MaintenanceReportSchema);

export default MaintenanceReport;

