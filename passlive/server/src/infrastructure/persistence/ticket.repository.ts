import type { PersistenceSink } from "./json-repository.js";
import type { Ticket, CreateTicketInput } from "../../domain/entities/ticket.js";
import { JsonRepository, newId } from "./json-repository.js";
import {
  generateBleToken,
  generateQrCode,
  nowIso,
} from "../../domain/services/ticket-crypto.js";

export class TicketRepository extends JsonRepository<Ticket> {
  constructor(sink: PersistenceSink) {
    super(sink, "tickets");
    this.hydrate(sink.load("tickets") as Record<string, Ticket>);
  }

  protected idOf(entity: Ticket): string {
    return entity.id;
  }

  protected clone(entity: Ticket): Ticket {
    return { ...entity };
  }

  createFromInput(input: CreateTicketInput): Ticket {
    return this.create({
      id: newId(),
      qrCode: generateQrCode(),
      bleToken: generateBleToken(),
      status: "VALID",
      purchaseDate: nowIso(),
      localId: input.localId ?? null,
      type: input.type,
      eventId: input.eventId,
      clientId: input.clientId,
    });
  }

  findByQrCode(qrCode: string): Ticket | undefined {
    return this.findAll().find((t) => t.qrCode === qrCode);
  }

  findByBleToken(bleToken: string): Ticket | undefined {
    return this.findAll().find((t) => t.bleToken === bleToken);
  }

  findByEvent(eventId: string): Ticket[] {
    return this.findAll().filter((t) => t.eventId === eventId);
  }

  findByClient(clientId: string): Ticket[] {
    return this.findAll().filter((t) => t.clientId === clientId);
  }
}
