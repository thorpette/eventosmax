import { Router } from "express";
import type { Repositories } from "../../infrastructure/persistence/repositories.js";
import { NotFoundError } from "../../domain/common/errors.js";
import {
  validateQrSchema,
  validateBleSchema,
  accessRecordSchema,
} from "../validators/ticket.validators.js";
import { validateBody } from "./middleware.js";
import {
  evaluateAccess,
  mapEvaluationToRecord,
} from "../../domain/services/access-control.js";

/**
 * Proceso de ValidaciÃ³n de Entradas en Acceso (BPMN):
 *  InclusiveGateway_1 -> Task_QR (QR) / Task_BT (Bluetooth)
 *  ExclusiveGateway_1 "Â¿Entrada vÃ¡lida?" -> Task_Registrar / Task_Denegar
 */
export function validationRouter(repos: Repositories): Router {
  const router = Router();

  /** EvalÃºa validez de una entrada (Gateway_1) y devuelve la rama a tomar. */
  function checkTicket(ticketId: string): {
    ticketId: string;
    entradaValida: boolean;
    event: unknown;
    client: unknown;
    reason: string | null;
  } {
    const ticket = repos.tickets.findById(ticketId);
    if (!ticket) throw new NotFoundError("Entrada", ticketId);
    const event = repos.events.findById(ticket.eventId);
    const client = repos.clients.findById(ticket.clientId);
    const entradaValida = ticket.status === "VALID";
    return {
      ticketId: ticket.id,
      entradaValida,
      event,
      client,
      reason: entradaValida ? null : `Estado de entrada: ${ticket.status}`,
    };
  }

  // Task_QR: Validar entrada por cÃ³digo QR
  router.post("/qr", validateBody(validateQrSchema), (req, res) => {
    const ticket = repos.tickets.findByQrCode(req.body.qrCode);
    if (!ticket) throw new NotFoundError("Entrada", req.body.qrCode);
    const check = checkTicket(ticket.id);
    res.json({ ...check, method: "QR" as const });
  });

  // Task_BT: Validar entrada por Bluetooth
  router.post("/ble", validateBody(validateBleSchema), (req, res) => {
    const ticket = repos.tickets.findByBleToken(req.body.bleToken);
    if (!ticket) throw new NotFoundError("Entrada", req.body.bleToken);
    const check = checkTicket(ticket.id);
    // El umbral RSSI lo define el local (Stitch: -65 dBm por defecto).
    const client = repos.clients.findById(ticket.clientId);
    const venue = ticket.localId ? repos.venues.findById(ticket.localId) : undefined;
    const threshold = venue?.rssiThreshold ?? -65;
    const rssiOk = req.body.rssi === undefined || req.body.rssi >= threshold;
    res.json({
      ...check,
      method: "BLE" as const,
      clientBleToken: client?.bleToken ?? null,
      rssiThreshold: threshold,
      rssiInRange: rssiOk,
      entradaValida: check.entradaValida && rssiOk,
      reason: !rssiOk ? `SeÃ±al BLE fuera de rango (${req.body.rssi} dBm < ${threshold} dBm)` : check.reason,
    });
  });

  // Task_Registrar / Task_Denegar: registrar acceso + actualizar estado de entrada
  router.post("/access", validateBody(accessRecordSchema), (req, res) => {
    const body = req.body;
    const ticket = repos.tickets.findById(body.ticketId);
    if (!ticket) throw new NotFoundError("Entrada", body.ticketId);
    const event = repos.events.findById(ticket.eventId);
    if (!event) throw new NotFoundError("Evento", ticket.eventId);
    const client = repos.clients.findById(ticket.clientId);
    if (!client) throw new NotFoundError("Cliente", ticket.clientId);

    if (ticket.status !== "VALID") {
      // Rama "entradaValida == false" -> Task_Denegar
      const record = repos.accessRecords.createFromInput({
        ticketId: ticket.id,
        method: body.method,
        result: "DENIED",
        reason: `Entrada no vÃ¡lida (estado: ${ticket.status})`,
        ageVerified: false,
        route: null,
        operatorNote: body.operatorNote ?? null,
      });
      repos.tickets.update(ticket.id, { status: "DENIED" });
      res.status(200).json({ allowed: false, reason: record.reason, accessRecord: record });
      return;
    }

    // Rama "entradaValida == true" -> Task_Registrar + Control de Restricciones.
    // El portador puede alegar otra fecha (p.ej. presentar DNI en taquilla),
    // por lo que body.birthDate tiene prioridad sobre la registrada.
    const evaluation = evaluateAccess({
      birthDate: body.birthDate ?? client.birthDate,
      minAge: body.minAge ?? event.minAge,
      ticketType: ticket.type,
    });
    const recordInput = mapEvaluationToRecord(
      ticket.id,
      body.method,
      evaluation,
      body.operatorNote ?? null,
    );
    const record = repos.accessRecords.createFromInput(recordInput);

    if (evaluation.allowed) {
      repos.tickets.update(ticket.id, { status: "USED" });
      res.status(201).json({ allowed: true, evaluation, accessRecord: record });
      return;
    }
    repos.tickets.update(ticket.id, { status: "DENIED" });
    res.status(200).json({ allowed: false, evaluation, accessRecord: record });
  });

  // Historial de accesos de una entrada
  router.get("/access/:ticketId", (req, res) => {
    const ticket = repos.tickets.findById(req.params.ticketId);
    if (!ticket) throw new NotFoundError("Entrada", req.params.ticketId);
    res.json({ items: repos.accessRecords.findByTicket(ticket.id) });
  });

  return router;
}
