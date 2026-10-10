import { z } from "zod";

export const venueStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);
export const validationTechSchema = z.enum(["BLE", "QR", "DUAL"]);

export const createVenueSchema = z.object({
  name: z.string().min(2).max(120),
  license: z.string().min(3).max(60),
  address: z.string().min(3).max(200),
  city: z.string().min(2).max(80),
  maxCapacity: z.number().int().min(50).max(15000),
  capacityPercent: z.number().int().min(50).max(98),
  rssiThreshold: z.number().int().min(-90).max(-40).default(-65),
  qrRotationSeconds: z.number().int().min(5).max(120).default(15),
  validationTechnology: validationTechSchema.default("DUAL"),
});

export const updateVenueSchema = createVenueSchema.partial().extend({
  status: venueStatusSchema.optional(),
});

export type CreateVenueDto = z.infer<typeof createVenueSchema>;
export type UpdateVenueDto = z.infer<typeof updateVenueSchema>;
