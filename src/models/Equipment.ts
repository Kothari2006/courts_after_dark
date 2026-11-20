import mongoose, { Schema, Document, Model } from "mongoose";

export type EquipmentStatus = "AVAILABLE" | "UNAVAILABLE";

export type EquipmentCategory =
  | "BADMINTON"
  | "BASKETBALL"
  | "FOOTBALL"
  | "CRICKET"
  | "TENNIS"
  | "GYM"
  | "OTHER";

export const EQUIPMENT_CATEGORIES: EquipmentCategory[] = [
  "BADMINTON",
  "BASKETBALL",
  "FOOTBALL",
  "CRICKET",
  "TENNIS",
  "GYM",
  "OTHER",
];

export interface IEquipment extends Document {
  name: string;
  category: EquipmentCategory;
  description?: string;
  totalQuantity: number;
  availableQuantity: number;
  damagedQuantity: number;
  status: EquipmentStatus;
  createdAt: Date;
  updatedAt: Date;
}

const EquipmentSchema = new Schema<IEquipment>(
  {
    name: {
      type: String,
      required: [true, "Equipment name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
      index: true,
    },
    category: {
      type: String,
      enum: {
        values: EQUIPMENT_CATEGORIES,
        message: "{VALUE} is not a valid equipment category",
      },
      required: [true, "Category is required"],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    totalQuantity: {
      type: Number,
      required: [true, "Total quantity is required"],
      min: [0, "Total quantity cannot be negative"],
    },
    availableQuantity: {
      type: Number,
      required: [true, "Available quantity is required"],
      min: [0, "Available quantity cannot be negative"],
      validate: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        validator: function (this: any, value: number) {
          return value <= this.totalQuantity;
        },
        message: "Available quantity cannot exceed total quantity",
      },
    },
    damagedQuantity: {
      type: Number,
      required: [true, "Damaged quantity is required"],
      min: [0, "Damaged quantity cannot be negative"],
      default: 0,
      validate: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        validator: function (this: any, value: number) {
          const avail = this.availableQuantity !== undefined ? this.availableQuantity : 0;
          return avail + value <= this.totalQuantity;
        },
        message: "Sum of available and damaged quantities cannot exceed total quantity",
      },
    },
    status: {
      type: String,
      enum: {
        values: ["AVAILABLE", "UNAVAILABLE"],
        message: "{VALUE} is not a valid equipment status",
      },
      default: "AVAILABLE",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

EquipmentSchema.index({ category: 1, status: 1 });

export const Equipment: Model<IEquipment> =
  mongoose.models.Equipment ||
  mongoose.model<IEquipment>("Equipment", EquipmentSchema);

export default Equipment;

