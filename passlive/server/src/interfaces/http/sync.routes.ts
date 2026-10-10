import { Router } from "express";
import type { Repositories } from "../../infrastructure/persistence/repositories.js";
import { NotFoundError, BusinessRuleError } from "../../domain/common/errors.js";
import {
  ticketSyncSchema,
  validationConfirmationSchema,
} from "../validators/sync.validators.js";
import { validateBody } from "./middleware.js";

/**
 * ColaboraciÃ³n entre Sistema de Venta y Locales (BPMN):
 *  MessageFlow_1 "Datos de entrada (QR, tipo, evento)" -> Local
 *    Process_Local: Task_Almacenar (BD local) -> Task_Validar -> Task_EnviarConfirmacion
 *  MessageFlow_2 "ConfirmaciÃ³n de validaciÃ³n" -> Sistema de Venta
 *    Process_Sistema: IntermediateCatchEvent -> Task_Actualizar (estado en sistema central)
 */
export function syncRouter(repos: Repositories): Router {
  const router = Router();

  // MessageFlow_1: el Sistema de Venta envÃ­a los datos de la entrada al Local
  router.post("/tickets", validateBody(ticketSyncSchema), (req, res) => {
    const body = req.body;
    const ticket = repos.tickets.findByQrCode(body.qrCode);
    if (!ticket) throw new NotFoundError("Entrada", body.qrCode);
    const venue = repos.venues.findById(body.localId);
    if (!venue) throw new NotFoundError("Local", body.localId);

    // Task_Almacenar: almacenar entrada en base de datos local
    const updated = repos.tickets.update(ticket.id, { localId: venue.id });
    const message = repos.syncMessages.createMessage({
      type: "TICKET_SENT",
      ticketId: ticket.id,
      localId: venue.id,
      payloadJson: JSON.stringify(body),
    });
    repos.syncMessages.markStatus(message.id, "SENT");
    res.status(201).json({ synced: true, ticket: updated, syncMessage: message });
  });

  // MessageFlow_2: el Local confirma la validaciÃ³n al Sistema de Venta
  router.post("/confirmations", validateBody(validationConfirmationSchema), (req, res) => {
    const body = req.body;
    const ticket = repos.tickets.findByQrCode(body.qrCode);
    if (!ticket) throw new NotFoundError("Entrada", body.qrCode);

    // Task_Actualizar: actualizar estado de entrada en sistema central
    const nextStatus =
      body.result === "ALLOWED" ? ("USED" as const) : ("DENIED" as const);
    repos.tickets.update(ticket.id, { status: nextStatus });

    const record = repos.accessRecords.createFromInput({
      ticketId: ticket.id,
      method: body.method,
      result: body.result,
      reason: body.reason ?? null,
      ageVerified: body.result === "ALLOWED",
      route: body.result === "ALLOWED" ? (ticket.type === "VIP" ? "VIP" : "GENERAL") : null,
      operatorNote: null,
    });

    const message = repos.syncMessages.createMessage({
      type: "VALIDATION_CONFIRMED",
      ticketId: ticket.id,
      localId: body.localId,
      payloadJson: JSON.stringify(body),
    });
    repos.syncMessages.markStatus(message.id, "CONFIRMED");

    res.status(201).json({ updated: true, ticket: repos.tickets.findById(ticket.id), accessRecord: record, syncMessage: message });
  });

  // Historial de sincronizaciones de una entrada
  router.get("/messages/:ticketId", (req, res) => {
    const ticket = repos.tickets.findById(req.params.ticketId);
    if (!ticket) throw new NotFoundError("Entrada", req.params.ticketId);
    res.json({ items: repos.syncMessages.findByTicket(ticket.id) });
  });

  return router;
}
