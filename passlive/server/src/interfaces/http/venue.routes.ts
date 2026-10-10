import { Router } from "express";
import type { Repositories } from "../../infrastructure/persistence/repositories.js";
import { NotFoundError, ConflictError } from "../../domain/common/errors.js";
import { createVenueSchema, updateVenueSchema } from "../validators/venue.validators.js";
import { validateBody } from "./middleware.js";

/**
 * Gestion de Local (BPMN): Alta / Consulta / EdiciÃƒÂ³n / Baja.
 */
export function venueRouter(repos: Repositories): Router {
  const router = Router();

  // Consulta
  router.get("/", (_req, res) => {
    res.json({ items: repos.venues.findAll() });
  });

  // Detalle
  router.get("/:id", (req, res) => {
    const id = req.params.id ?? "";
    const venue = repos.venues.findById(id);
    if (!venue) throw new NotFoundError("Local", id);
    res.json(venue);
  });

  // Alta
  router.post("/", validateBody(createVenueSchema), (req, res) => {
    const existing = repos.venues.findByLicense(req.body.license);
    if (existing) throw new ConflictError(`Ya existe un local con licencia ${req.body.license}`);
    const venue = repos.venues.createFromInput(req.body);
    res.status(201).json(venue);
  });

  // EdiciÃƒÂ³n
  router.put("/:id", validateBody(updateVenueSchema), (req, res) => {
    const id = req.params.id ?? "";
    const updated = repos.venues.update(id, req.body);
    if (!updated) throw new NotFoundError("Local", id);
    res.json(updated);
  });

  // Baja
  router.delete("/:id", (req, res) => {
    const id = req.params.id ?? "";
    const deleted = repos.venues.delete(id);
    if (!deleted) throw new NotFoundError("Local", id);
    res.status(204).send();
  });

  return router;
}
