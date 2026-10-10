export type TicketCategory = "GENERAL" | "VIP";
export type TicketStatus = "VALID" | "INVALID" | "USED" | "DENIED" | "PENDING_SYNC";

export interface Venue {
  id: string;
  name: string;
  license: string;
  address: string;
  city: string;
  maxCapacity: number;
  capacityPercent: number;
  rssiThreshold: number;
  qrRotationSeconds: number;
  validationTechnology: "BLE" | "QR" | "DUAL";
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
}

export interface TicketType {
  id: string;
  eventId: string;
  name: string;
  category: TicketCategory;
  price: number;
  fees: number;
  capacity: number;
  sold: number;
}

export interface AvailabilitySector {
  ticketTypeId: string;
  name: string;
  category: TicketCategory;
  capacity: number;
  sold: number;
  available: number;
  status: "AVAILABLE" | "LOW" | "SOLD_OUT";
}

export interface Event {
  id: string;
  name: string;
  code: string;
  date: string;
  startTime: string;
  endTime: string;
  venueId: string;
  ageRestriction: "NONE" | "OVER_18" | "OVER_21";
  minAge: number;
  capacity: number;
  basePrice: number;
  status: "DRAFT" | "PUBLISHED" | "CANCELLED" | "FINISHED";
  createdAt: string;
  ticketTypes?: TicketType[];
  availability?: { available: boolean; sectors: AvailabilitySector[] };
}

export interface Client {
  id: string;
  name: string;
  dni: string;
  birthDate: string;
  email: string;
  phone: string;
  bleToken: string;
  status: "ACTIVE" | "DEACTIVATED";
  createdAt: string;
  tickets?: Ticket[];
}

export interface Ticket {
  id: string;
  qrCode: string;
  bleToken: string;
  type: TicketCategory;
  status: TicketStatus;
  purchaseDate: string;
  eventId: string;
  clientId: string;
  localId: string | null;
  event?: Event | null;
  client?: Client | null;
}

export interface AccessRecord {
  id: string;
  ticketId: string;
  method: "QR" | "BLE";
  result: "ALLOWED" | "DENIED";
  reason: string | null;
  ageVerified: boolean;
  route: "VIP" | "GENERAL" | null;
  operatorNote: string | null;
  validatedAt: string;
}

export interface ValidationResponse {
  ticketId: string;
  entradaValida: boolean;
  method: "QR" | "BLE";
  reason: string | null;
  event?: Event | null;
  client?: Client | null;
  rssiThreshold?: number;
  rssiInRange?: boolean;
}

export interface AccessEvaluation {
  allowed?: boolean;
  evaluation: {
    eventRequiresAdult: boolean;
    ageVerified: boolean;
    age: number;
    isVip: boolean;
    allowed: boolean;
    route: "VIP" | "GENERAL" | null;
    reason: string | null;
  };
  accessRecord: AccessRecord;
}

export interface OrderResponse {
  order: { status: string; reference: string; subtotal: number; fees: number; total: number };
  tickets: Ticket[];
  deliveredTo: { email: string; phone: string };
}
