import { Router } from "express";
import type { Repositories } from "../../infrastructure/persistence/repositories.js";
import { NotFoundError, BusinessRuleError } from "../../domain/common/errors.js";
import { createEventSchema, updateEventSchema } from "../validators/event.validators.js";
import { validateBody } from "./middleware.js";
import { computeAvailability } from "../../domain/services/availability.js";

/**
 * Gestion de Evento (BPMN): Alta / Consulta / EdiciÃƒÂ³n / Baja.
 */
export function eventRouter(repos: Repositories): Router {
  const router = Router();

  // Consulta (incluye tipologías y disponibilidad como el detalle)
  router.get("/", (_req, res) => {
    const items = repos.events.findAll().map((event) => {
      const types = repos.ticketTypes.findByEvent(event.id);
      return { ...event, ticketTypes: types, availability: computeAvailability(types) };
    });
    res.json({ items });
  });

  router.get("/published", (_req, res) => {
    const items = repos.events.findPublished().map((event) => {
      const types = repos.ticketTypes.findByEvent(event.id);
      return { ...event, ticketTypes: types, availability: computeAvailability(types) };
    });
    res.json({ items });
  });

  // Detalle
  router.get("/:id", (req, res) => {
    const id = req.params.id ?? "";
    const event = repos.events.findById(id);
    if (!event) throw new NotFoundError("Evento", id);
    const types = repos.ticketTypes.findByEvent(event.id);
    res.json({ ...event, ticketTypes: types, availability: computeAvailability(types) });
  });

  // Alta
  router.post("/", validateBody(createEventSchema), (req, res) => {
    const venue = repos.venues.findById(req.body.venueId);
    if (!venue) throw new NotFoundError("Local", req.body.venueId);
    if (repos.events.findByCode(req.body.code)) {
      throw new BusinessRuleError(`El cÃƒÂ³digo de evento ${req.body.code} ya existe`);
    }
    const event = repos.events.createFromInput(req.body);
    // TipologÃƒÂ­as por defecto derivadas del BPMN (VIP o General).
    repos.ticketTypes.createFromInput({
      eventId: event.id,
      name: "Entrada General",
      category: "GENERAL",
      price: event.basePrice,
      fees: 3.5,
      capacity: Math.floor(event.capacity * 0.8),
    });
    repos.ticketTypes.createFromInput({
      eventId: event.id,
      name: "AcreditaciÃƒÂ³n VIP",
      category: "VIP",
      price: Math.round(event.basePrice * 2.4 * 100) / 100,
      fees: 5,
      capacity: Math.floor(event.capacity * 0.2),
    });
    res.status(201).json(event);
  });

  // EdiciÃƒÂ³n
  router.put("/:id", validateBody(updateEventSchema), (req, res) => {
    const id = req.params.id ?? "";
    const updated = repos.events.update(id, req.body);
    if (!updated) throw new NotFoundError("Evento", id);
    res.json(updated);
  });

  // Baja
  router.delete("/:id", (req, res) => {
    const id = req.params.id ?? "";
    const deleted = repos.events.delete(id);
    if (!deleted) throw new NotFoundError("Evento", id);
    res.status(204).send();
  });

  return router;
}
