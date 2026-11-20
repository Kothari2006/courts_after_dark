import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type AuditActionType = "ROLE_CHANGE" | "STATUS_CHANGE";

export interface IAuditLog extends Document {
  admin: Types.ObjectId;
  targetUser: Types.ObjectId;
  actionType: AuditActionType;
  previousValue: string;
  newValue: string;
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    admin: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Admin reference is required"],
      index: true,
    },
    targetUser: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Target user reference is required"],
      index: true,
    },
    actionType: {
      type: String,
      enum: {
        values: ["ROLE_CHANGE", "STATUS_CHANGE"],
        message: "{VALUE} is not a valid audit action type",
      },
      required: [true, "Action type is required"],
      index: true,
    },
    previousValue: {
      type: String,
      required: [true, "Previous value is required"],
    },
    newValue: {
      type: String,
      required: [true, "New value is required"],
    },
    reason: {
      type: String,
      trim: true,
      maxlength: [500, "Reason cannot exceed 500 characters"],
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

AuditLogSchema.index({ targetUser: 1, createdAt: -1 });

const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog ||
  mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);

export default AuditLog;

