export type ClientStatus = "ACTIVE" | "DEACTIVATED";

export interface Client {
  id: string;
  name: string;
  dni: string;
  /** Fecha de nacimiento yyyy-MM-dd. */
  birthDate: string;
  email: string;
  phone: string;
  /** Token/identificador para validación Bluetooth (BPMN: habilitar validación Bluetooth). */
  bleToken: string;
  status: ClientStatus;
  createdAt: string;
}

export interface CreateClientInput {
  name: string;
  dni: string;
  birthDate: string;
  email: string;
  phone: string;
}
