import mongoose, { Schema, Document, Model, Types } from "mongoose";
import { SportType } from "./Facility";

export type EventType =
  | "FRIENDLY_MATCH"
  | "TOURNAMENT"
  | "PRACTICE"
  | "COLLEGE_EVENT";

export type ParticipationType = "INDIVIDUAL" | "TEAM";

export type EventStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "REGISTRATION_OPEN"
  | "REGISTRATION_CLOSED"
  | "ONGOING"
  | "COMPLETED"
  | "CANCELLED";

export interface ITournamentMatch {
  matchId: string;
  round: number; // 1, 2, 3 (e.g. 1 = Quarters, 2 = Semis, 3 = Finals)
  matchNumber: number;
  team1: string;
  team2: string;
  scheduledTime?: Date | null;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED";
  score1?: number;
  score2?: number;
  winner?: string | null;
}

export interface IEvent extends Document {
  title: string;
  description: string;
  sportType: SportType;
  eventType: EventType;
  facility: Types.ObjectId;
  organizer: Types.ObjectId;
  startAt: Date;
  endAt: Date;
  registrationStartAt: Date;
  registrationEndAt: Date;
  participantLimit: number;
  registrationCount: number;
  participationType: ParticipationType;
  teamSizeLimit: number;
  status: EventStatus;
  rules: string;
  bannerImage?: string | null;
  cancellationReason?: string | null;
  cancelledBy?: Types.ObjectId | null;
  cancelledAt?: Date | null;
  tournamentMatches: ITournamentMatch[];
  createdAt: Date;
  updatedAt: Date;
}

const TournamentMatchSchema = new Schema<ITournamentMatch>(
  {
    matchId: { type: String, required: true },
    round: { type: Number, required: true },
    matchNumber: { type: Number, required: true },
    team1: { type: String, required: true },
    team2: { type: String, required: true },
    scheduledTime: { type: Date, default: null },
    status: {
      type: String,
      enum: ["SCHEDULED", "IN_PROGRESS", "COMPLETED"],
      default: "SCHEDULED",
    },
    score1: { type: Number, default: 0 },
    score2: { type: Number, default: 0 },
    winner: { type: String, default: null },
  },
  { _id: false }
);

const EventSchema = new Schema<IEvent>(
  {
    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters"],
      index: true,
    },
    description: {
      type: String,
      required: [true, "Event description is required"],
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
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
    eventType: {
      type: String,
      required: [true, "Event type is required"],
      enum: {
        values: ["FRIENDLY_MATCH", "TOURNAMENT", "PRACTICE", "COLLEGE_EVENT"],
        message: "{VALUE} is not a valid event type",
      },
      index: true,
    },
    facility: {
      type: Schema.Types.ObjectId,
      ref: "Facility",
      required: [true, "Facility reference is required"],
      index: true,
    },
    organizer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Organizer reference (Teacher) is required"],
      index: true,
    },
    startAt: {
      type: Date,
      required: [true, "Start time is required"],
      index: true,
    },
    endAt: {
      type: Date,
      required: [true, "End time is required"],
      index: true,
      validate: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        validator: function (this: any, value: Date) {
          return this.startAt ? value > this.startAt : true;
        },
        message: "End time must be strictly after start time",
      },
    },
    registrationStartAt: {
      type: Date,
      required: [true, "Registration start date is required"],
    },
    registrationEndAt: {
      type: Date,
      required: [true, "Registration end date is required"],
      validate: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        validator: function (this: any, value: Date) {
          return this.registrationStartAt ? value >= this.registrationStartAt : true;
        },
        message: "Registration end date must be on or after registration start date",
      },
    },
    participantLimit: {
      type: Number,
      required: [true, "Participant limit is required"],
      min: [2, "Participant limit must be at least 2"],
      max: [500, "Participant limit cannot exceed 500"],
    },
    registrationCount: {
      type: Number,
      default: 0,
      min: [0, "Registration count cannot be negative"],
    },
    participationType: {
      type: String,
      enum: {
        values: ["INDIVIDUAL", "TEAM"],
        message: "{VALUE} is not a valid participation type",
      },
      default: "INDIVIDUAL",
    },
    teamSizeLimit: {
      type: Number,
      default: 1,
      min: [1, "Team size must be at least 1"],
      max: [25, "Team size cannot exceed 25"],
    },
    status: {
      type: String,
      enum: {
        values: [
          "DRAFT",
          "PUBLISHED",
          "REGISTRATION_OPEN",
          "REGISTRATION_CLOSED",
          "ONGOING",
          "COMPLETED",
          "CANCELLED",
        ],
        message: "{VALUE} is not a valid event status",
      },
      default: "DRAFT",
      index: true,
    },
    rules: {
      type: String,
      trim: true,
      maxlength: [3000, "Rules cannot exceed 3000 characters"],
      default: "Standard university athletic tournament regulations apply.",
    },
    bannerImage: {
      type: String,
      default: null,
    },
    cancellationReason: {
      type: String,
      trim: true,
      maxlength: [500, "Cancellation reason cannot exceed 500 characters"],
      default: null,
    },
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    tournamentMatches: {
      type: [TournamentMatchSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

EventSchema.index({ facility: 1, startAt: 1, endAt: 1 });
EventSchema.index({ status: 1, startAt: 1 });
EventSchema.index({ organizer: 1, status: 1 });

const Event: Model<IEvent> =
  mongoose.models.Event || mongoose.model<IEvent>("Event", EventSchema);

export { Event };
export default Event;
