import { Router } from "express";
import type { Repositories } from "../../infrastructure/persistence/repositories.js";
import { NotFoundError, ConflictError } from "../../domain/common/errors.js";
import { createClientSchema, updateClientSchema } from "../validators/client.validators.js";
import { validateBody } from "./middleware.js";

/**
 * Gestion de Cliente (BPMN): Alta / Consulta / EdiciÃƒÂ³n / Baja.
 */
export function clientRouter(repos: Repositories): Router {
  const router = Router();

  // Consulta
  router.get("/", (req, res) => {
    const q = typeof req.query.q === "string" ? req.query.q.trim().toLowerCase() : "";
    let items = repos.clients.findAll();
    if (q) {
      items = items.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.dni.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.phone.includes(q),
      );
    }
    res.json({ items });
  });

  // Detalle
  router.get("/:id", (req, res) => {
    const id = req.params.id ?? "";
    const client = repos.clients.findById(id);
    if (!client) throw new NotFoundError("Cliente", id);
    const tickets = repos.tickets.findByClient(client.id);
    res.json({ ...client, tickets });
  });

  // Alta
  router.post("/", validateBody(createClientSchema), (req, res) => {
    if (repos.clients.findByDni(req.body.dni)) {
      throw new ConflictError(`Ya existe un cliente con DNI ${req.body.dni}`);
    }
    const client = repos.clients.createFromInput(req.body);
    res.status(201).json(client);
  });

  // EdiciÃƒÂ³n
  router.put("/:id", validateBody(updateClientSchema), (req, res) => {
    const id = req.params.id ?? "";
    const updated = repos.clients.update(id, req.body);
    if (!updated) throw new NotFoundError("Cliente", id);
    res.json(updated);
  });

  // Baja (BPMN: Dar de baja Cliente -> revocar BLE)
  router.delete("/:id", (req, res) => {
    const id = req.params.id ?? "";
    const client = repos.clients.findById(id);
    if (!client) throw new NotFoundError("Cliente", id);
    repos.clients.update(client.id, { status: "DEACTIVATED" });
    res.status(204).send();
  });

  return router;
}
