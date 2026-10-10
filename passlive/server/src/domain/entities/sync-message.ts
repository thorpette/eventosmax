export type SyncType = "TICKET_SENT" | "VALIDATION_CONFIRMED";
export type SyncStatus = "PENDING" | "SENT" | "CONFIRMED";

export interface SyncMessage {
  id: string;
  type: SyncType;
  ticketId: string;
  localId: string | null;
  payloadJson: string;
  status: SyncStatus;
  createdAt: string;
}
