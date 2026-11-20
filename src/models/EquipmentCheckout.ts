import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type CheckoutStatus =
  | "REQUESTED"
  | "ISSUED"
  | "RETURNED"
  | "OVERDUE"
  | "DAMAGED"
  | "REJECTED"
  | "CANCELLED";

export interface ICheckoutItem {
  equipment: Types.ObjectId;
  quantity: number;
  returnedQuantity: number;
  damagedQuantity: number;
}

export interface IEquipmentCheckout extends Document {
  user: Types.ObjectId;
  booking: Types.ObjectId;
  equipment?: Types.ObjectId;
  quantity?: number;
  items: ICheckoutItem[];
  issuedAt?: Date | null;
  expectedReturnAt: Date;
  returnedAt?: Date | null;
  issuedBy?: Types.ObjectId | null;
  returnedBy?: Types.ObjectId | null;
  status: CheckoutStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CheckoutItemSchema = new Schema<ICheckoutItem>(
  {
    equipment: {
      type: Schema.Types.ObjectId,
      ref: "Equipment",
      required: [true, "Equipment item is required"],
    },
    quantity: {
      type: Number,
      required: [true, "Requested quantity is required"],
      min: [1, "Quantity must be at least 1"],
    },
    returnedQuantity: {
      type: Number,
      default: 0,
      min: [0, "Returned quantity cannot be negative"],
    },
    damagedQuantity: {
      type: Number,
      default: 0,
      min: [0, "Damaged quantity cannot be negative"],
    },
  },
  { _id: false }
);

const EquipmentCheckoutSchema = new Schema<IEquipmentCheckout>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      index: true,
    },
    booking: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: [true, "Booking reference is required"],
      index: true,
    },
    equipment: {
      type: Schema.Types.ObjectId,
      ref: "Equipment",
      default: null,
      index: true,
    },
    quantity: {
      type: Number,
      default: null,
    },
    items: {
      type: [CheckoutItemSchema],
      default: [],
    },
    issuedAt: {
      type: Date,
      default: null,
      index: true,
    },
    expectedReturnAt: {
      type: Date,
      required: [true, "Expected return timestamp is required"],
      index: true,
    },
    returnedAt: {
      type: Date,
      default: null,
    },
    issuedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    returnedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: [
          "REQUESTED",
          "ISSUED",
          "RETURNED",
          "OVERDUE",
          "DAMAGED",
          "REJECTED",
          "CANCELLED",
        ],
        message: "{VALUE} is not a valid checkout status",
      },
      default: "REQUESTED",
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

EquipmentCheckoutSchema.index({ "items.equipment": 1, status: 1 });
EquipmentCheckoutSchema.index({ user: 1, status: 1 });
EquipmentCheckoutSchema.index({ booking: 1, status: 1 });
EquipmentCheckoutSchema.index({ status: 1, expectedReturnAt: 1 });

export const EquipmentCheckout: Model<IEquipmentCheckout> =
  mongoose.models.EquipmentCheckout ||
  mongoose.model<IEquipmentCheckout>(
    "EquipmentCheckout",
    EquipmentCheckoutSchema
  );

export default EquipmentCheckout;
