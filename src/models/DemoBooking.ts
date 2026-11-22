import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IDemoBooking extends Document {
  user: Types.ObjectId;
  externalId: string;
  facilityId: string;
  facilityName: string;
  sportType: string;
  location: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  startAt: Date;
  endAt: Date;
  status: "CONFIRMED" | "CANCELLED";
  bookingType: "REGULAR" | "PRIME_TIME";
  attendanceStatus: "PENDING" | "CHECKED_IN" | "NO_SHOW";
}

const DemoBookingSchema = new Schema<IDemoBooking>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    externalId: { type: String, required: true, unique: true, index: true },
    facilityId: { type: String, required: true },
    facilityName: { type: String, required: true },
    sportType: { type: String, required: true },
    location: { type: String, default: "" },
    bookingDate: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    startAt: { type: Date, required: true, index: true },
    endAt: { type: Date, required: true },
    status: { type: String, enum: ["CONFIRMED", "CANCELLED"], default: "CONFIRMED" },
    bookingType: { type: String, enum: ["REGULAR", "PRIME_TIME"], default: "REGULAR" },
    attendanceStatus: {
      type: String,
      enum: ["PENDING", "CHECKED_IN", "NO_SHOW"],
      default: "PENDING",
    },
  },
  { timestamps: true }
);

export const DemoBooking: Model<IDemoBooking> =
  mongoose.models.DemoBooking ||
  mongoose.model<IDemoBooking>("DemoBooking", DemoBookingSchema);

export default DemoBooking;
