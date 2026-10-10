export type ValidationMethod = "QR" | "BLE";
export type AccessResult = "ALLOWED" | "DENIED";
export type AccessRoute = "VIP" | "GENERAL" | null;

export interface AccessRecord {
  id: string;
  ticketId: string;
  method: ValidationMethod;
  result: AccessResult;
  reason: string | null;
  ageVerified: boolean;
  route: AccessRoute;
  operatorNote: string | null;
  validatedAt: string;
}

export interface CreateAccessRecordInput {
  ticketId: string;
  method: ValidationMethod;
  result: AccessResult;
  reason?: string | null;
  ageVerified?: boolean;
  route?: AccessRoute;
  operatorNote?: string | null;
}
