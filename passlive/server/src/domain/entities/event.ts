export type EventStatus = "DRAFT" | "PUBLISHED" | "CANCELLED" | "FINISHED";
export type AgeRestriction = "NONE" | "OVER_18" | "OVER_21";

export interface Event {
  id: string;
  name: string;
  code: string;
  /** Fecha ISO (yyyy-MM-dd). */
  date: string;
  /** Hora inicio HH:mm. */
  startTime: string;
  /** Hora fin HH:mm. */
  endTime: string;
  venueId: string;
  ageRestriction: AgeRestriction;
  /** Edad mínima efectiva derivada de ageRestriction (SUPUESTO: 18 por defecto). */
  minAge: number;
  capacity: number;
  basePrice: number;
  status: EventStatus;
  createdAt: string;
}

export interface CreateEventInput {
  name: string;
  code: string;
  date: string;
  startTime: string;
  endTime: string;
  venueId: string;
  ageRestriction: AgeRestriction;
  capacity: number;
  basePrice: number;
  status?: EventStatus;
}
