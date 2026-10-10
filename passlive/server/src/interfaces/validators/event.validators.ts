import { z } from "zod";

export const ageRestrictionSchema = z.enum(["NONE", "OVER_18", "OVER_21"]);
export const eventStatusSchema = z.enum(["DRAFT", "PUBLISHED", "CANCELLED", "FINISHED"]);

export const createEventSchema = z.object({
  name: z.string().min(3).max(160),
  code: z
    .string()
    .min(3)
    .max(40)
    .regex(/^[A-Za-z0-9-]+$/, "El código solo puede contener letras, números y guiones"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida (yyyy-MM-dd)"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Hora de inicio inválida (HH:mm)"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Hora de fin inválida (HH:mm)"),
  venueId: z.string().min(1),
  ageRestriction: ageRestrictionSchema.default("NONE"),
  capacity: z.number().int().min(1),
  basePrice: z.number().min(0),
  status: eventStatusSchema.optional(),
});

export const updateEventSchema = createEventSchema.partial();

export type CreateEventDto = z.infer<typeof createEventSchema>;
export type UpdateEventDto = z.infer<typeof updateEventSchema>;
