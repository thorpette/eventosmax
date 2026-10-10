import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { loadConfig } from "../src/infrastructure/config.js";
import { createRepositories } from "../src/infrastructure/persistence/repositories.js";
import { createApp } from "../src/interfaces/http/app.js";

const config = { ...loadConfig(), databasePath: ":memory:", apiKey: "test-key" };
let app: Express;

beforeAll(() => {
  const repos = createRepositories(config.databasePath);
  app = createApp(config, repos);
});

afterAll(() => {
  // No hay recursos que liberar: el sink en memoria se recolecta con el proceso.
});

const auth = () => ({ "x-api-key": "test-key" });

describe("API integración (BPMN CRUD + Venta + Validación + Sincronización)", () => {
  let venueId = "";
  let eventId = "";
  let clientId = "";
  let generalTypeId = "";
  let vipTypeId = "";
  let qrCode = "";

  it("GET /api/health responde ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("rechaza sin API key", async () => {
    const res = await request(app).get("/api/venues");
    expect(res.status).toBe(401);
  });

  it("Alta de Local", async () => {
    const res = await request(app)
      .post("/api/venues")
      .set(auth())
      .send({
        name: "Teatro Kapital Madrid",
        license: "LIC-MAD-001",
        address: "Calle de Atocha 125, Madrid",
        city: "Madrid",
        maxCapacity: 2400,
        capacityPercent: 85,
        rssiThreshold: -65,
        qrRotationSeconds: 15,
        validationTechnology: "DUAL",
      });
    expect(res.status).toBe(201);
    venueId = res.body.id;
  });

  it("Alta de Evento", async () => {
    const res = await request(app)
      .post("/api/events")
      .set(auth())
      .send({
        name: "Nocturna Sound Wave",
        code: "ERP-NOCT-001",
        date: "2026-07-18",
        startTime: "21:00",
        endTime: "04:30",
        venueId,
        ageRestriction: "OVER_18",
        capacity: 2000,
        basePrice: 45,
      });
    expect(res.status).toBe(201);
    eventId = res.body.id;
    expect(res.body.minAge).toBe(18);
  });

  it("Consulta de Evento con tipologías por defecto", async () => {
    const res = await request(app).get(`/api/events/${eventId}`).set(auth());
    expect(res.status).toBe(200);
    expect(res.body.ticketTypes.length).toBeGreaterThanOrEqual(2);
    generalTypeId = res.body.ticketTypes.find((t: { category: string }) => t.category === "GENERAL").id;
    vipTypeId = res.body.ticketTypes.find((t: { category: string }) => t.category === "VIP").id;
  });

  it("Alta de Cliente", async () => {
    const res = await request(app)
      .post("/api/clients")
      .set(auth())
      .send({
        name: "Carlos Mendoza Gil",
        dni: "48291048K",
        birthDate: "1998-05-14",
        email: "carlos.mendoza@passlive.app",
        phone: "+34 612 345 678",
      });
    expect(res.status).toBe(201);
    clientId = res.body.id;
    expect(res.body.bleToken).toMatch(/^BLE-/);
  });

  it("Task_3: verificar disponibilidad (Gateway_1)", async () => {
    const res = await request(app)
      .get(`/api/sales/events/${eventId}/availability`)
      .set(auth());
    expect(res.status).toBe(200);
    expect(res.body.disponibilidad).toBe(true);
  });

  it("Task_5-8: procesar pedido -> pago -> entrada QR+BLE -> envío", async () => {
    const res = await request(app)
      .post("/api/sales/orders")
      .set(auth())
      .send({
        eventId,
        clientId,
        lines: [
          { ticketTypeId: generalTypeId, quantity: 2 },
          { ticketTypeId: vipTypeId, quantity: 1 },
        ],
        holderName: "Carlos Mendoza Gil",
        holderDni: "48291048K",
        ageVerified: true,
        localId: venueId,
      });
    expect(res.status).toBe(201);
    expect(res.body.order.status).toBe("PAID");
    expect(res.body.tickets).toHaveLength(3);
    qrCode = res.body.tickets[0].qrCode;
    expect(qrCode).toMatch(/^QR-/);
    expect(res.body.tickets[0].bleToken).toMatch(/^BLE-/);
    expect(res.body.deliveredTo.email).toContain("@");
  });

  it("Task_4: registrar falta de disponibilidad (lista de espera)", async () => {
    const res = await request(app)
      .post("/api/sales/waitlist")
      .set(auth())
      .send({ eventId, name: "Ana Torres", email: "ana@ejemplo.com", phone: "+34 600 000 000" });
    expect(res.status).toBe(201);
    expect(res.body.notified).toBe(true);
  });

  it("MessageFlow_1: enviar datos de entrada al Local", async () => {
    const ticket = await request(app).get(`/api/tickets/by-qr/${qrCode}`).set(auth());
    const res = await request(app)
      .post("/api/sync/tickets")
      .send({
        qrCode,
        bleToken: ticket.body.bleToken,
        type: ticket.body.type,
        eventId: ticket.body.eventId,
        localId: venueId,
        purchaseDate: ticket.body.purchaseDate,
      });
    expect(res.status).toBe(201);
    expect(res.body.synced).toBe(true);
  });

  it("Task_QR: validar entrada por QR -> entrada válida", async () => {
    const res = await request(app)
      .post("/api/validation/qr")
      .set(auth())
      .send({ qrCode, method: "QR" });
    expect(res.status).toBe(200);
    expect(res.body.entradaValida).toBe(true);
    expect(res.body.method).toBe("QR");
  });

  it("Task_BT: validar entrada por Bluetooth", async () => {
    const ticket = await request(app).get(`/api/tickets/by-qr/${qrCode}`).set(auth());
    const res = await request(app)
      .post("/api/validation/ble")
      .set(auth())
      .send({ bleToken: ticket.body.bleToken, method: "BLE", rssi: -58 });
    expect(res.status).toBe(200);
    expect(res.body.entradaValida).toBe(true);
    expect(res.body.rssiInRange).toBe(true);
  });

  it("Task_Registrar: registrar acceso y actualizar estado (control de restricciones)", async () => {
    const ticket = await request(app).get(`/api/tickets/by-qr/${qrCode}`).set(auth());
    const res = await request(app)
      .post("/api/validation/access")
      .set(auth())
      .send({
        ticketId: ticket.body.id,
        birthDate: ticket.body.client.birthDate,
        minAge: 18,
        method: "QR",
      });
    expect(res.status).toBe(201);
    expect(res.body.allowed).toBe(true);
    expect(res.body.evaluation.route).toBe("GENERAL");
    expect(res.body.accessRecord.result).toBe("ALLOWED");
  });

  it("MessageFlow_2: confirmar validación al Sistema de Venta", async () => {
    const res = await request(app)
      .post("/api/sync/confirmations")
      .send({ qrCode, method: "QR", result: "ALLOWED", localId: venueId });
    expect(res.status).toBe(201);
    expect(res.body.updated).toBe(true);
    expect(res.body.ticket.status).toBe("USED");
  });

  it("deniega entrada ya usada (Gateway_1 rama false)", async () => {
    const ticket = await request(app).get(`/api/tickets/by-qr/${qrCode}`).set(auth());
    const res = await request(app)
      .post("/api/validation/access")
      .set(auth())
      .send({
        ticketId: ticket.body.id,
        birthDate: ticket.body.client.birthDate,
        minAge: 18,
        method: "QR",
      });
    expect(res.status).toBe(200);
    expect(res.body.allowed).toBe(false);
    expect(res.body.accessRecord.result).toBe("DENIED");
  });

  it("Baja de Entrada invalida el ticket", async () => {
    const ticket = await request(app).get(`/api/tickets/by-qr/${qrCode}`).set(auth());
    const del = await request(app).delete(`/api/tickets/${ticket.body.id}`).set(auth());
    expect(del.status).toBe(204);
    const check = await request(app)
      .post("/api/validation/qr")
      .set(auth())
      .send({ qrCode, method: "QR" });
    expect(check.body.entradaValida).toBe(false);
  });

  it("validación de entrada inexistente -> 404", async () => {
    const res = await request(app)
      .post("/api/validation/qr")
      .set(auth())
      .send({ qrCode: "QR-NOEXISTE", method: "QR" });
    expect(res.status).toBe(404);
  });
});
