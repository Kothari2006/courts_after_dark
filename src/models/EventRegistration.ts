import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type EventAttendanceStatus = "REGISTERED" | "ATTENDED" | "NO_SHOW";
export type RegistrationStatus = "CONFIRMED" | "CANCELLED";

export interface ITeamMember {
  user?: Types.ObjectId | null;
  name: string;
  email: string;
}

export interface IEventRegistration extends Document {
  event: Types.ObjectId;
  user: Types.ObjectId;
  participationType: "INDIVIDUAL" | "TEAM";
  teamName?: string | null;
  teamMembers: ITeamMember[];
  attendanceStatus: EventAttendanceStatus;
  markedAt?: Date | null;
  markedBy?: Types.ObjectId | null;
  status: RegistrationStatus;
  cancelledAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const TeamMemberSchema = new Schema<ITeamMember>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    name: {
      type: String,
      required: [true, "Team member name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Team member email is required"],
      trim: true,
      lowercase: true,
    },
  },
  { _id: false }
);

const EventRegistrationSchema = new Schema<IEventRegistration>(
  {
    event: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: [true, "Event reference is required"],
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Registrant user reference is required"],
      index: true,
    },
    participationType: {
      type: String,
      enum: ["INDIVIDUAL", "TEAM"],
      default: "INDIVIDUAL",
    },
    teamName: {
      type: String,
      trim: true,
      maxlength: [100, "Team name cannot exceed 100 characters"],
      default: null,
    },
    teamMembers: {
      type: [TeamMemberSchema],
      default: [],
    },
    attendanceStatus: {
      type: String,
      enum: {
        values: ["REGISTERED", "ATTENDED", "NO_SHOW"],
        message: "{VALUE} is not a valid attendance status",
      },
      default: "REGISTERED",
      index: true,
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
    status: {
      type: String,
      enum: {
        values: ["CONFIRMED", "CANCELLED"],
        message: "{VALUE} is not a valid registration status",
      },
      default: "CONFIRMED",
      index: true,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
EventRegistrationSchema.index({ event: 1, user: 1, status: 1 });
EventRegistrationSchema.index({ event: 1, status: 1 });
EventRegistrationSchema.index({ user: 1, status: 1 });

const EventRegistration: Model<IEventRegistration> =
  mongoose.models.EventRegistration ||
  mongoose.model<IEventRegistration>("EventRegistration", EventRegistrationSchema);

export { EventRegistration };
export default EventRegistration;
