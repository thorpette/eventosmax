import { z } from "zod";

/** MessageFlow_1: datos de entrada (QR, tipo, evento) hacia el Local. */
export const ticketSyncSchema = z.object({
  qrCode: z.string().min(4),
  bleToken: z.string().min(4),
  type: z.enum(["GENERAL", "VIP"]),
  eventId: z.string().min(1),
  localId: z.string().min(1),
  purchaseDate: z.string().min(4),
});

/** MessageFlow_2: confirmación de validación hacia el Sistema de Venta. */
export const validationConfirmationSchema = z.object({
  qrCode: z.string().min(4),
  method: z.enum(["QR", "BLE"]),
  result: z.enum(["ALLOWED", "DENIED"]),
  localId: z.string().min(1),
  reason: z.string().max(300).optional(),
});

export type TicketSyncDto = z.infer<typeof ticketSyncSchema>;
export type ValidationConfirmationDto = z.infer<typeof validationConfirmationSchema>;
