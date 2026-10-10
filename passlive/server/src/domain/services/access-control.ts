import type { AccessRecord } from "../entities/access-record.js";

export interface EvaluateAccessInput {
  /** Fecha de nacimiento del portador (yyyy-MM-dd). */
  birthDate: string;
  /** Edad mínima requerida por el evento. */
  minAge: number;
  /** Tipo de entrada (VIP/General) - BPMN Gateway_3. */
  ticketType: "VIP" | "GENERAL";
}

export interface EvaluateAccessOutput {
  /** Gateway_1: ¿Evento es para mayores de edad? */
  eventRequiresAdult: boolean;
  /** Gateway_2: ¿Verificación de edad exitosa? */
  ageVerified: boolean;
  age: number;
  /** Gateway_3: ¿Tipo de entrada es VIP? */
  isVip: boolean;
  allowed: boolean;
  route: "VIP" | "GENERAL" | null;
  reason: string | null;
}

export function calculateAge(birthDate: string, now: Date = new Date()): number {
  const birth = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(birth.getTime())) {
    throw new Error(`Fecha de nacimiento inválida: ${birthDate}`);
  }
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const monthDiff = now.getUTCMonth() - birth.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < birth.getUTCDate())) {
    age -= 1;
  }
  return age;
}

/**
 * Implementa el BPMN "Control de Acceso por Restricciones".
 * Secuencia: Gateway_1 (¿Evento es para mayores de edad?) -> Task_2/Task_3
 * -> Gateway_2 (¿Verificación de edad exitosa?) -> Gateway_3 (¿VIP?) ->
 * Task_5/Task_6 -> Task_7 (Permitir acceso).
 */
export function evaluateAccess(
  input: EvaluateAccessInput,
  now: Date = new Date(),
): EvaluateAccessOutput {
  const eventRequiresAdult = input.minAge > 0;
  const age = calculateAge(input.birthDate, now);
  const ageVerified = !eventRequiresAdult || age >= input.minAge;
  const isVip = input.ticketType === "VIP";

  if (!ageVerified) {
    return {
      eventRequiresAdult,
      ageVerified,
      age,
      isVip,
      allowed: false,
      route: null,
      reason: `Restricción de edad: se requiere ${input.minAge}+ (edad actual: ${age})`,
    };
  }

  return {
    eventRequiresAdult,
    ageVerified,
    age,
    isVip,
    allowed: true,
    route: isVip ? "VIP" : "GENERAL",
    reason: null,
  };
}

export function mapEvaluationToRecord(
  ticketId: string,
  method: AccessRecord["method"],
  evaluation: EvaluateAccessOutput,
  operatorNote: string | null = null,
): Omit<AccessRecord, "id" | "validatedAt"> {
  return {
    ticketId,
    method,
    result: evaluation.allowed ? "ALLOWED" : "DENIED",
    reason: evaluation.reason,
    ageVerified: evaluation.ageVerified,
    route: evaluation.allowed ? evaluation.route : null,
    operatorNote,
  };
}
