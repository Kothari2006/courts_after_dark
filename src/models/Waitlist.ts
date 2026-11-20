import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type WaitlistStatus = "WAITING" | "PROMOTED" | "CANCELLED" | "EXPIRED";

export interface IWaitlist extends Document {
  user: Types.ObjectId;
  facility: Types.ObjectId;
  requestedDate: Date;
  startAt: Date;
  endAt: Date;
  status: WaitlistStatus;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

const WaitlistSchema = new Schema<IWaitlist>(
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
    requestedDate: {
      type: Date,
      required: [true, "Requested date is required"],
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
    status: {
      type: String,
      enum: {
        values: ["WAITING", "PROMOTED", "CANCELLED", "EXPIRED"],
        message: "{VALUE} is not a valid waitlist status",
      },
      default: "WAITING",
      index: true,
    },
    position: {
      type: Number,
      required: [true, "Waitlist position is required"],
      min: [1, "Waitlist position must be at least 1"],
    },
  },
  {
    timestamps: true,
  }
);

// High-performance compound indexes for queue ordering and duplicate prevention
WaitlistSchema.index(
  { user: 1, facility: 1, startAt: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "WAITING" },
  }
);
WaitlistSchema.index({ facility: 1, startAt: 1, endAt: 1, status: 1, position: 1 });
WaitlistSchema.index({ user: 1, status: 1 });

export const Waitlist: Model<IWaitlist> =
  mongoose.models.Waitlist ||
  mongoose.model<IWaitlist>("Waitlist", WaitlistSchema);

export default Waitlist;

