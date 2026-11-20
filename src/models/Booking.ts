import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED"
  | "REJECTED";

export type BookingType = "REGULAR" | "PRIME_TIME";
export type AttendanceStatus = "PENDING" | "CHECKED_IN" | "NO_SHOW";

export interface IBooking extends Document {
  user: Types.ObjectId;
  facility: Types.ObjectId;
  bookingDate: Date;
  startTime: string; // HH:mm local representation
  endTime: string;   // HH:mm local representation
  startAt: Date;     // UTC timestamp
  endAt: Date;       // UTC timestamp
  status: BookingStatus;
  bookingType: BookingType;
  attendanceStatus: AttendanceStatus;
  markedNoShowAt?: Date | null;
  markedNoShowBy?: Types.ObjectId | null;
  markedCheckInAt?: Date | null;
  markedCheckInBy?: Types.ObjectId | null;
  cancellationReason?: string;
  cancelledAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      index: true,
    },
    facility: {
      type: Schema.Types.ObjectId,
      ref: "Facility",
      required: [true, "Facility reference is required"],
      index: true,
    },
    bookingDate: {
      type: Date,
      required: [true, "Booking date is required"],
      index: true,
    },
    startTime: {
      type: String,
      required: [true, "Start time is required (HH:mm)"],
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, "Time format must be HH:mm"],
    },
    endTime: {
      type: String,
      required: [true, "End time is required (HH:mm)"],
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, "Time format must be HH:mm"],
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
        message: "End time (endAt) must be strictly after start time (startAt)",
      },
    },
    status: {
      type: String,
      enum: {
        values: ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "REJECTED"],
        message: "{VALUE} is not a valid booking status",
      },
      default: "PENDING",
      index: true,
    },
    bookingType: {
      type: String,
      enum: {
        values: ["REGULAR", "PRIME_TIME"],
        message: "{VALUE} is not a valid booking type",
      },
      default: "REGULAR",
      index: true,
    },
    attendanceStatus: {
      type: String,
      enum: {
        values: ["PENDING", "CHECKED_IN", "NO_SHOW"],
        message: "{VALUE} is not a valid attendance status",
      },
      default: "PENDING",
      index: true,
    },
    markedNoShowAt: {
      type: Date,
      default: null,
    },
    markedNoShowBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    markedCheckInAt: {
      type: Date,
      default: null,
    },
    markedCheckInBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    cancellationReason: {
      type: String,
      trim: true,
      default: null,
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

// High-performance compound indexes for slot conflict checks and user booking limits
BookingSchema.index(
  { facility: 1, startAt: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["CONFIRMED", "PENDING"] },
    },
  }
);
BookingSchema.index({ facility: 1, startAt: 1, endAt: 1, status: 1 });
BookingSchema.index({ user: 1, startAt: 1, status: 1 });
BookingSchema.index({ facility: 1, bookingDate: 1, status: 1 });

export const Booking: Model<IBooking> =
  mongoose.models.Booking || mongoose.model<IBooking>("Booking", BookingSchema);

export default Booking;

