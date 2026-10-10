import type { TicketCategory } from "./ticket-type.js";

export type TicketStatus =
  | "VALID"
  | "INVALID"
  | "USED"
  | "DENIED"
  | "PENDING_SYNC";

export interface Ticket {
  id: string;
  /** Código QR único generado en la venta (BPMN Task_7). */
  qrCode: string;
  /** Habilitación de validación Bluetooth (BPMN Task_7). */
  bleToken: string;
  type: TicketCategory;
  status: TicketStatus;
  purchaseDate: string;
  eventId: string;
  clientId: string;
  /** Local de destino cuando la entrada ha sido sincronizada (Colaboración). */
  localId: string | null;
}

export interface CreateTicketInput {
  type: TicketCategory;
  eventId: string;
  clientId: string;
  localId?: string | null;
}
