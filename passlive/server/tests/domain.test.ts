import { beforeEach, describe, expect, it } from "vitest";
import {
  evaluateAccess,
  calculateAge,
} from "../src/domain/services/access-control.js";
import {
  computeAvailability,
  computeOrderTotal,
} from "../src/domain/services/availability.js";
import type { TicketType } from "../src/domain/entities/ticket-type.js";

describe("calculateAge", () => {
  it("calcula la edad cumplida", () => {
    expect(calculateAge("2000-01-01", new Date("2026-01-01T00:00:00Z"))).toBe(26);
    expect(calculateAge("2000-12-31", new Date("2026-01-01T00:00:00Z"))).toBe(25);
  });
});

describe("evaluateAccess (BPMN Control de Acceso por Restricciones)", () => {
  const now = new Date("2026-06-01T00:00:00Z");

  it("deniega si no cumple la edad mínima (Gateway_2 -> Task_4)", () => {
    const result = evaluateAccess(
      { birthDate: "2010-01-01", minAge: 18, ticketType: "GENERAL" },
      now,
    );
    expect(result.eventRequiresAdult).toBe(true);
    expect(result.ageVerified).toBe(false);
    expect(result.allowed).toBe(false);
    expect(result.route).toBeNull();
    expect(result.reason).toContain("Restricción de edad");
  });

  it("permite acceso general si cumple edad (Gateway_3 rama No)", () => {
    const result = evaluateAccess(
      { birthDate: "1990-05-05", minAge: 18, ticketType: "GENERAL" },
      now,
    );
    expect(result.allowed).toBe(true);
    expect(result.route).toBe("GENERAL");
    expect(result.isVip).toBe(false);
  });

  it("permite acceso VIP si cumple edad (Gateway_3 rama Sí)", () => {
    const result = evaluateAccess(
      { birthDate: "1985-02-02", minAge: 21, ticketType: "VIP" },
      now,
    );
    expect(result.allowed).toBe(true);
    expect(result.route).toBe("VIP");
    expect(result.isVip).toBe(true);
  });

  it("evento sin restricción no exige verificación de edad (Gateway_1 rama No)", () => {
    const result = evaluateAccess(
      { birthDate: "2015-01-01", minAge: 0, ticketType: "GENERAL" },
      now,
    );
    expect(result.eventRequiresAdult).toBe(false);
    expect(result.ageVerified).toBe(true);
    expect(result.allowed).toBe(true);
  });
});

describe("computeAvailability (BPMN Task_3 + Gateway_1)", () => {
  const types: TicketType[] = [
    { id: "t1", eventId: "e", name: "General", category: "GENERAL", price: 45, fees: 3.5, capacity: 100, sold: 100 },
    { id: "t2", eventId: "e", name: "VIP", category: "VIP", price: 110, fees: 5, capacity: 20, sold: 5 },
  ];

  it("reporta disponibilidad global y por sector", () => {
    const result = computeAvailability(types);
    expect(result.available).toBe(true);
    expect(result.sectors[0]?.status).toBe("SOLD_OUT");
    expect(result.sectors[1]?.available).toBe(15);
  });

  it("sin entradas libres -> disponibilidad false", () => {
    const soldOut = types.map((t) => ({ ...t, sold: t.capacity }));
    const result = computeAvailability(soldOut);
    expect(result.available).toBe(false);
  });
});

describe("computeOrderTotal (BPMN Task_5/6)", () => {
  it("suma subtotal y gastos de gestión", () => {
    const lines = [
      {
        ticketType: { id: "a", eventId: "e", name: "G", category: "GENERAL" as const, price: 45, fees: 3.5, capacity: 10, sold: 0 },
        quantity: 2,
      },
      {
        ticketType: { id: "b", eventId: "e", name: "V", category: "VIP" as const, price: 110, fees: 5, capacity: 10, sold: 0 },
        quantity: 1,
      },
    ];
    expect(computeOrderTotal(lines)).toEqual({ subtotal: 200, fees: 12, total: 212 });
  });
});
