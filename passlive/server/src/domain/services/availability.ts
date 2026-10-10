import type { CreateTicketInput, Ticket } from "../entities/ticket.js";
import type { TicketType } from "../entities/ticket-type.js";

export interface AvailabilitySector {
  ticketTypeId: string;
  name: string;
  category: TicketType["category"];
  capacity: number;
  sold: number;
  available: number;
  status: "AVAILABLE" | "LOW" | "SOLD_OUT";
}

/**
 * BPMN Task_3 "Verificar disponibilidad de entradas" + Gateway_1
 * "¿Hay disponibilidad?" -> disponibilidad == true | false.
 */
export function computeAvailability(
  types: TicketType[],
): { available: boolean; sectors: AvailabilitySector[] } {
  const sectors = types.map((t) => {
    const available = Math.max(0, t.capacity - t.sold);
    let status: AvailabilitySector["status"] = "AVAILABLE";
    if (available === 0) status = "SOLD_OUT";
    else if (available <= Math.max(1, Math.floor(t.capacity * 0.1))) status = "LOW";
    return {
      ticketTypeId: t.id,
      name: t.name,
      category: t.category,
      capacity: t.capacity,
      sold: t.sold,
      available,
      status,
    };
  });
  return { available: sectors.some((s) => s.available > 0), sectors };
}

/** Calcula el importe total de un pedido (BPMN Task_5 "Elegir cantidad y tipo"). */
export function computeOrderTotal(
  lines: Array<{ ticketType: TicketType; quantity: number }>,
): { subtotal: number; fees: number; total: number } {
  let subtotal = 0;
  let fees = 0;
  for (const line of lines) {
    subtotal += line.ticketType.price * line.quantity;
    fees += line.ticketType.fees * line.quantity;
  }
  const round = (n: number) => Math.round(n * 100) / 100;
  return { subtotal: round(subtotal), fees: round(fees), total: round(subtotal + fees) };
}

export type CreateTicketFactory = (input: CreateTicketInput) => Ticket;
