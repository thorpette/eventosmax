import { z } from "zod";

export const createClientSchema = z.object({
  name: z.string().min(3).max(120),
  dni: z
    .string()
    .min(5)
    .max(20)
    .regex(/^[A-Za-z0-9-]+$/, "DNI inválido (solo letras, números y guiones)"),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha de nacimiento inválida (yyyy-MM-dd)"),
  email: z.string().email("Email inválido"),
  phone: z
    .string()
    .min(7)
    .max(20)
    .regex(/^\+?[0-9\s-]+$/, "Teléfono inválido"),
});

export const updateClientSchema = createClientSchema.partial();

export type CreateClientDto = z.infer<typeof createClientSchema>;
export type UpdateClientDto = z.infer<typeof updateClientSchema>;
