import { Router } from "express";
import type { Repositories } from "../../infrastructure/persistence/repositories.js";
import { NotFoundError, BusinessRuleError } from "../../domain/common/errors.js";
import {
  createOrderSchema,
  waitlistSchema,
} from "../validators/sales.validators.js";
import { validateBody } from "./middleware.js";
import { computeAvailability, computeOrderTotal } from "../../domain/services/availability.js";
import type { TicketType } from "../../domain/entities/ticket-type.js";

/**
 * Proceso de Venta de Entradas (BPMN):
 *  Task_1 Buscar eventos disponibles
 *  Task_2 Seleccionar evento (cliente)
 *  Task_3 Verificar disponibilidad + Gateway_1
 *  Task_4 Notificar falta de disponibilidad (lista de espera)
 *  Task_5 Elegir cantidad y tipo (VIP/General)
 *  Task_6 Procesar pago
 *  Task_7 Generar entrada con QR Ãºnico + habilitar Bluetooth
 *  Task_8 Enviar entrada al cliente
 */
export function salesRouter(repos: Repositories): Router {
  const router = Router();

  // Task_1: Buscar eventos disponibles en el sistema
  router.get("/events", (_req, res) => {
    const events = repos.events.findPublished();
    const items = events.map((event) => {
      const types = repos.ticketTypes.findByEvent(event.id);
      const availability = computeAvailability(types);
      return { ...event, ticketTypes: types, availability };
    });
    res.json({ items });
  });

  // Task_2: Seleccionar evento -> detalle
  router.get("/events/:eventId", (req, res) => {
    const event = repos.events.findById(req.params.eventId);
    if (!event) throw new NotFoundError("Evento", req.params.eventId);
    const types = repos.ticketTypes.findByEvent(event.id);
    res.json({ ...event, ticketTypes: types, availability: computeAvailability(types) });
  });

  // Task_3 + Gateway_1: Â¿Hay disponibilidad?
  router.get("/events/:eventId/availability", (req, res) => {
    const event = repos.events.findById(req.params.eventId);
    if (!event) throw new NotFoundError("Evento", req.params.eventId);
    const types = repos.ticketTypes.findByEvent(event.id);
    const availability = computeAvailability(types);
    res.json({
      eventId: event.id,
      disponibilidad: availability.available, // condiciÃ³n del gateway
      sectors: availability.sectors,
    });
  });

  // Task_5/6/7/8: elegir cantidad+tipo, pagar, generar entrada y enviar
  router.post("/orders", validateBody(createOrderSchema), (req, res) => {
    const body = req.body;
    const event = repos.events.findById(body.eventId);
    if (!event) throw new NotFoundError("Evento", body.eventId);
    const client = repos.clients.findById(body.clientId);
    if (!client) throw new NotFoundError("Cliente", body.clientId);

    const lines = body.lines.map((line: { ticketTypeId: string; quantity: number }) => {
      const ticketType = repos.ticketTypes.findById(line.ticketTypeId);
      if (!ticketType) throw new NotFoundError("TipologÃ­a de entrada", line.ticketTypeId);
      if (ticketType.eventId !== event.id) {
        throw new BusinessRuleError("La tipologÃ­a no pertenece al evento seleccionado");
      }
      const available = ticketType.capacity - ticketType.sold;
      if (line.quantity > available) {
        // Gateway_1 rama "No disponible"
        throw new BusinessRuleError(
          `Sin disponibilidad: quedan ${available} entradas de ${ticketType.name}`,
        );
      }
      return { ticketType, quantity: line.quantity };
    }) as Array<{ ticketType: TicketType; quantity: number }>;

    // Task_6: Procesar pago (SUPUESTO: pago simulado, BPMN no define pasarela)
    const totals = computeOrderTotal(lines);
    const payment = {
      status: "PAID" as const,
      reference: `TX-${Date.now()}`,
      ...totals,
    };

    // Task_7 + Task_8: generar entrada con QR Ãºnico + BLE y "enviarla" al cliente
    const createdTickets = lines.flatMap(({ ticketType, quantity }) => {
      repos.ticketTypes.incrementSold(ticketType.id, quantity);
      return Array.from({ length: quantity }, () =>
        repos.tickets.createFromInput({
          type: ticketType.category,
          eventId: event.id,
          clientId: client.id,
          localId: body.localId ?? null,
        }),
      );
    });

    res.status(201).json({
      order: { ...payment, eventId: event.id, clientId: client.id },
      tickets: createdTickets,
      deliveredTo: { email: client.email, phone: client.phone }, // Task_8
    });
  });

  // Task_4: Notificar falta de disponibilidad (lista de espera)
  router.post("/waitlist", validateBody(waitlistSchema), (req, res) => {
    const event = repos.events.findById(req.body.eventId);
    if (!event) throw new NotFoundError("Evento", req.body.eventId);
    res.status(201).json({
      id: `WL-${Date.now()}`,
      eventId: event.id,
      notified: true,
      channel: "EMAIL+SMS",
      message: `Te avisaremos cuando se libere aforo para ${event.name}`,
      ...req.body,
    });
  });

  return router;
}
