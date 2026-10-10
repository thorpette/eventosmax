import { z } from "zod";

export const orderLineSchema = z.object({
  ticketTypeId: z.string().min(1),
  quantity: z.number().int().min(1).max(6),
});

export const createOrderSchema = z.object({
  eventId: z.string().min(1),
  clientId: z.string().min(1),
  lines: z.array(orderLineSchema).min(1),
  /** Acreditación del titular principal (Stitch: nombre + DNI + verificación +18). */
  holderName: z.string().min(3).max(120),
  holderDni: z.string().min(5).max(20),
  ageVerified: z.boolean().default(false),
  /** Local de destino para sincronizar la entrada (Colaboración BPMN). */
  localId: z.string().min(1).optional(),
});

export const waitlistSchema = z.object({
  eventId: z.string().min(1),
  name: z.string().min(3).max(120),
  email: z.string().email("Email inválido"),
  phone: z.string().min(7).max(20),
});

export type CreateOrderDto = z.infer<typeof createOrderSchema>;
export type WaitlistDto = z.infer<typeof waitlistSchema>;
