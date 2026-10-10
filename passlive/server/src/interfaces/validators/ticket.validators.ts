import { z } from "zod";

export const ticketCategorySchema = z.enum(["GENERAL", "VIP"]);
export const ticketStatusSchema = z.enum(["VALID", "INVALID", "USED", "DENIED", "PENDING_SYNC"]);

export const createTicketSchema = z.object({
  type: ticketCategorySchema,
  eventId: z.string().min(1),
  clientId: z.string().min(1),
  localId: z.string().min(1).nullable().optional(),
});

export const updateTicketSchema = z.object({
  type: ticketCategorySchema.optional(),
  status: ticketStatusSchema.optional(),
});

export const validateQrSchema = z.object({
  qrCode: z.string().min(4),
  method: z.enum(["QR"]).default("QR"),
  operatorNote: z.string().max(500).optional(),
});

export const validateBleSchema = z.object({
  bleToken: z.string().min(4),
  method: z.enum(["BLE"]).default("BLE"),
  /** RSSI simulado recibido del lector (Stitch: umbral -65 dBm). */
  rssi: z.number().int().min(-100).max(0).optional(),
  operatorNote: z.string().max(500).optional(),
});

export const accessRecordSchema = z.object({
  ticketId: z.string().min(1),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  minAge: z.number().int().min(0).max(99).optional(),
  method: z.enum(["QR", "BLE"]).default("QR"),
  operatorNote: z.string().max(500).optional(),
});

export type CreateTicketDto = z.infer<typeof createTicketSchema>;
export type UpdateTicketDto = z.infer<typeof updateTicketSchema>;
export type ValidateQrDto = z.infer<typeof validateQrSchema>;
export type ValidateBleDto = z.infer<typeof validateBleSchema>;
export type AccessRecordDto = z.infer<typeof accessRecordSchema>;
