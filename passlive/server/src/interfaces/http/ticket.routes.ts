import { Router } from "express";
import type { Repositories } from "../../infrastructure/persistence/repositories.js";
import { NotFoundError } from "../../domain/common/errors.js";
import {
  createTicketSchema,
  updateTicketSchema,
} from "../validators/ticket.validators.js";
import { validateBody } from "./middleware.js";

/**
 * Gestion de Entrada (BPMN): Alta / Consulta / EdiciÃƒÂ³n / Baja.
 */
export function ticketRouter(repos: Repositories): Router {
  const router = Router();

  // Consulta
  router.get("/", (req, res) => {
    const q = typeof req.query.q === "string" ? req.query.q.trim().toLowerCase() : "";
    const eventId = typeof req.query.eventId === "string" ? req.query.eventId : undefined;
    let items = repos.tickets.findAll();
    if (eventId) items = items.filter((t) => t.eventId === eventId);
    if (q) {
      items = items.filter(
        (t) => t.qrCode.toLowerCase().includes(q) || t.bleToken.toLowerCase().includes(q),
      );
    }
    res.json({ items });
  });

  // Detalle (BPMN Task_3: buscar por cÃƒÂ³digo QR, mostrar tipo, estado y datos del evento)
  router.get("/:id", (req, res) => {
    const id = req.params.id ?? "";
    const ticket = repos.tickets.findById(id);
    if (!ticket) throw new NotFoundError("Entrada", id);
    const event = repos.events.findById(ticket.eventId);
    const client = repos.clients.findById(ticket.clientId);
    const records = repos.accessRecords.findByTicket(ticket.id);
    res.json({ ...ticket, event, client, accessRecords: records });
  });

  // BÃƒÂºsqueda por cÃƒÂ³digo QR (usado por validadores)
  router.get("/by-qr/:qrCode", (req, res) => {
    const ticket = repos.tickets.findByQrCode(req.params.qrCode);
    if (!ticket) throw new NotFoundError("Entrada", req.params.qrCode);
    const event = repos.events.findById(ticket.eventId);
    const client = repos.clients.findById(ticket.clientId);
    res.json({ ...ticket, event, client });
  });

  // Alta
  router.post("/", validateBody(createTicketSchema), (req, res) => {
    const event = repos.events.findById(req.body.eventId);
    if (!event) throw new NotFoundError("Evento", req.body.eventId);
    const client = repos.clients.findById(req.body.clientId);
    if (!client) throw new NotFoundError("Cliente", req.body.clientId);
    const ticket = repos.tickets.createFromInput(req.body);
    res.status(201).json(ticket);
  });

  // EdiciÃƒÂ³n (BPMN Task_4: modificar tipo / actualizar estado)
  router.put("/:id", validateBody(updateTicketSchema), (req, res) => {
    const id = req.params.id ?? "";
    const updated = repos.tickets.update(id, req.body);
    if (!updated) throw new NotFoundError("Entrada", id);
    res.json(updated);
  });

  // Baja (BPMN Task_5: invalidar ticket, desactivar QR y validaciÃƒÂ³n Bluetooth)
  router.delete("/:id", (req, res) => {
    const id = req.params.id ?? "";
    const ticket = repos.tickets.findById(id);
    if (!ticket) throw new NotFoundError("Entrada", id);
    repos.tickets.update(ticket.id, { status: "INVALID" });
    res.status(204).send();
  });

  return router;
}
