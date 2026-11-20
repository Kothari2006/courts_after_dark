import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBookingPolicy extends Document {
  maxActiveBookings: number;
  maxAdvanceBookingDays: number;
  maxBookingDurationMinutes: number;
  cancellationDeadlineHours: number;
  maxPrimeTimeBookingsPerDay: number;
  primeTimeStart: string; // "18:00" (6 PM)
  primeTimeEnd: string;   // "21:00" (9 PM)
  enableWaitlist: boolean;
  enableNoShowTracking: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BookingPolicySchema = new Schema<IBookingPolicy>(
  {
    maxActiveBookings: {
      type: Number,
      required: [true, "Max active bookings is required"],
      min: [1, "Max active bookings must be at least 1"],
      default: 2,
    },
    maxAdvanceBookingDays: {
      type: Number,
      required: [true, "Max advance booking days is required"],
      min: [1, "Max advance booking days must be at least 1"],
      default: 7,
    },
    maxBookingDurationMinutes: {
      type: Number,
      required: [true, "Max booking duration in minutes is required"],
      min: [15, "Max booking duration must be at least 15 minutes"],
      default: 60,
    },
    cancellationDeadlineHours: {
      type: Number,
      required: [true, "Cancellation deadline hours is required"],
      min: [0, "Cancellation deadline hours cannot be negative"],
      default: 2,
    },
    maxPrimeTimeBookingsPerDay: {
      type: Number,
      required: [true, "Max prime time bookings per day is required"],
      min: [1, "Max prime time bookings per day must be at least 1"],
      default: 1,
    },
    primeTimeStart: {
      type: String,
      required: [true, "Prime time start is required (e.g. 18:00)"],
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, "Time format must be HH:mm"],
      default: "18:00",
    },
    primeTimeEnd: {
      type: String,
      required: [true, "Prime time end is required (e.g. 21:00)"],
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, "Time format must be HH:mm"],
      default: "21:00",
    },
    enableWaitlist: {
      type: Boolean,
      default: true,
    },
    enableNoShowTracking: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const BookingPolicy: Model<IBookingPolicy> =
  mongoose.models.BookingPolicy ||
  mongoose.model<IBookingPolicy>("BookingPolicy", BookingPolicySchema);

export default BookingPolicy;

