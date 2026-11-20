import { z } from "zod";
import { EQUIPMENT_CATEGORIES } from "@/models/Equipment";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createEquipmentSchema = z.object({
  name: z
    .string({ message: "Equipment name is required" })
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),
  category: z.enum(
    EQUIPMENT_CATEGORIES as [string, ...string[]],
    { message: "Invalid equipment category" }
  ),
  description: z.string().trim().optional().default(""),
  totalQuantity: z
    .number({ message: "Total quantity is required" })
    .int("Total quantity must be an integer")
    .min(0, "Total quantity cannot be negative"),
  status: z.enum(["AVAILABLE", "UNAVAILABLE"]).default("AVAILABLE"),
});

export const updateEquipmentSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  category: z.enum(EQUIPMENT_CATEGORIES as [string, ...string[]]).optional(),
  description: z.string().trim().optional(),
  totalQuantity: z.number().int().min(0).optional(),
  availableQuantity: z.number().int().min(0).optional(),
  damagedQuantity: z.number().int().min(0).optional(),
  status: z.enum(["AVAILABLE", "UNAVAILABLE"]).optional(),
});

export const requestItemSchema = z.object({
  equipmentId: z
    .string({ message: "Equipment ID is required" })
    .regex(objectIdRegex, "Invalid equipment ID format"),
  quantity: z
    .number({ message: "Quantity is required" })
    .int("Quantity must be an integer")
    .min(1, "Quantity must be at least 1"),
});

export const createEquipmentRequestSchema = z.object({
  bookingId: z
    .string({ message: "Booking ID is required" })
    .regex(objectIdRegex, "Invalid booking ID format"),
  items: z
    .array(requestItemSchema, { message: "At least one equipment item is required" })
    .min(1, "Request must contain at least one item"),
  expectedReturnAt: z
    .string({ message: "Expected return time is required" })
    .datetime({ message: "Expected return time must be a valid ISO timestamp" }),
  notes: z.string().trim().optional().default(""),
});

export const returnItemDamageSchema = z.object({
  equipmentId: z.string().regex(objectIdRegex),
  damagedQuantity: z.number().int().min(0).default(0),
});

export const returnEquipmentSchema = z.object({
  damagedItems: z.array(returnItemDamageSchema).optional().default([]),
  notes: z.string().trim().optional().default(""),
});

export type CreateEquipmentInput = z.infer<typeof createEquipmentSchema>;
export type UpdateEquipmentInput = z.infer<typeof updateEquipmentSchema>;
export type CreateEquipmentRequestInput = z.infer<typeof createEquipmentRequestSchema>;
export type ReturnEquipmentInput = z.infer<typeof returnEquipmentSchema>;

