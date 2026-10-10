export type TicketCategory = "GENERAL" | "VIP";

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

export interface CreateTicketTypeInput {
  eventId: string;
  name: string;
  category: TicketCategory;
  price: number;
  fees: number;
  capacity: number;
}
