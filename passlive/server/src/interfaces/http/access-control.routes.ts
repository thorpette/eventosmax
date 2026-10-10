import { Router } from "express";
import type { Repositories } from "../../infrastructure/persistence/repositories.js";
import { NotFoundError, BusinessRuleError } from "../../domain/common/errors.js";
import { validateBody } from "./middleware.js";
import {
  evaluateAccess,
  mapEvaluationToRecord,
} from "../../domain/services/access-control.js";

/**
 * Control de Acceso por Restricciones (BPMN):
 *  Task_1 Obtener datos del cliente y entrada
 *  Gateway_1 Â¿Evento es para mayores de edad? -> Task_2/3 (edad)
 *  Gateway_2 Â¿VerificaciÃ³n de edad exitosa? -> Task_4 (denegar)
 *  Gateway_3 Â¿Tipo de entrada es VIP? -> Task_5 (VIP) / Task_6 (general)
 *  Task_7 Permitir acceso al evento
 */
export function accessControlRouter(repos: Repositories): Router {
  const router = Router();

  // GET: evaluar restricciones de una entrada antes de permitir el paso
  router.get("/evaluate/:ticketId", (req, res) => {
    const ticket = repos.tickets.findById(req.params.ticketId);
    if (!ticket) throw new NotFoundError("Entrada", req.params.ticketId);
    const event = repos.events.findById(ticket.eventId);
    if (!event) throw new NotFoundError("Evento", ticket.eventId);
    const client = repos.clients.findById(ticket.clientId);
    if (!client) throw new NotFoundError("Cliente", ticket.clientId);

    const evaluation = evaluateAccess({
      birthDate: client.birthDate,
      minAge: event.minAge,
      ticketType: ticket.type,
    });

    const record = repos.accessRecords.createFromInput(
      mapEvaluationToRecord(ticket.id, "QR", evaluation, null),
    );
    if (evaluation.allowed) {
      repos.tickets.update(ticket.id, { status: "USED" });
    } else {
      repos.tickets.update(ticket.id, { status: "DENIED" });
    }

    res.json({ evaluation, accessRecord: record });
  });

  // POST: denegaciÃ³n explÃ­cita (Task_4) con motivo operativo
  router.post("/deny/:ticketId", (req, res) => {
    const ticket = repos.tickets.findById(req.params.ticketId);
    if (!ticket) throw new NotFoundError("Entrada", req.params.ticketId);
    const reason =
      typeof req.body?.reason === "string" && req.body.reason.trim().length > 0
        ? req.body.reason.trim()
        : null;
    if (!reason) throw new BusinessRuleError("Debe indicar el motivo de la denegaciÃ³n");
    const record = repos.accessRecords.createFromInput({
      ticketId: ticket.id,
      method: "QR",
      result: "DENIED",
      reason,
      ageVerified: false,
      route: null,
      operatorNote: typeof req.body?.operatorNote === "string" ? req.body.operatorNote : null,
    });
    repos.tickets.update(ticket.id, { status: "DENIED" });
    res.status(201).json({ allowed: false, accessRecord: record });
  });

  return router;
}
