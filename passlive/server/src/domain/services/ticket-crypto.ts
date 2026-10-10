import { randomBytes, randomUUID } from "node:crypto";

/** Genera un código QR único (BPMN Task_7 "Generar entrada con código QR único"). */
export function generateQrCode(prefix = "QR"): string {
  return `${prefix}-${randomBytes(6).toString("hex").toUpperCase()}`;
}

/** Genera el token de habilitación de validación Bluetooth (BPMN Task_7). */
export function generateBleToken(): string {
  return `BLE-${randomUUID()}`;
}

export function newId(): string {
  return randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}
