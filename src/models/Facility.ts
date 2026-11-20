import mongoose, { Schema, Document, Model } from "mongoose";

export type SportType =
  | "BADMINTON"
  | "BASKETBALL"
  | "FOOTBALL"
  | "CRICKET"
  | "TENNIS"
  | "GYM"
  | "OTHER";

export type FacilityStatus = "ACTIVE" | "INACTIVE" | "MAINTENANCE";

export interface IOperatingHours {
  open: string;  // e.g. "06:00"
  close: string; // e.g. "23:00"
}

export interface IFacility extends Document {
  name: string;
  description: string;
  sportType: SportType;
  location: string;
  capacity: number;
  images: string[];
  operatingHours: IOperatingHours;
  slotDuration: number; // in minutes
  timezone: string;
  status: FacilityStatus;
  createdAt: Date;
  updatedAt: Date;
}

const OperatingHoursSchema = new Schema<IOperatingHours>(
  {
    open: {
      type: String,
      required: [true, "Opening time is required (e.g. 06:00)"],
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, "Time format must be HH:mm"],
    },
    close: {
      type: String,
      required: [true, "Closing time is required (e.g. 23:00)"],
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, "Time format must be HH:mm"],
    },
  },
  { _id: false }
);

const FacilitySchema = new Schema<IFacility>(
  {
    name: {
      type: String,
      required: [true, "Facility name is required"],
      trim: true,
      maxlength: [150, "Facility name cannot exceed 150 characters"],
      index: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    sportType: {
      type: String,
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
      required: [true, "Sport type is required"],
      index: true,
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
      index: true,
    },
    capacity: {
      type: Number,
      required: [true, "Capacity is required"],
      min: [1, "Capacity must be at least 1"],
    },
    images: {
      type: [String],
      default: [],
    },
    operatingHours: {
      type: OperatingHoursSchema,
      required: [true, "Operating hours are required"],
    },
    slotDuration: {
      type: Number,
      required: [true, "Slot duration is required"],
      min: [15, "Slot duration must be at least 15 minutes"],
      default: 60,
    },
    timezone: {
      type: String,
      required: [true, "Timezone is required"],
      default: "Asia/Kolkata",
    },
    status: {
      type: String,
      enum: {
        values: ["ACTIVE", "INACTIVE", "MAINTENANCE"],
        message: "{VALUE} is not a valid facility status",
      },
      default: "ACTIVE",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

FacilitySchema.index({ sportType: 1, status: 1 });
FacilitySchema.index({ location: 1, status: 1 });

export const Facility: Model<IFacility> =
  mongoose.models.Facility ||
  mongoose.model<IFacility>("Facility", FacilitySchema);

export default Facility;

