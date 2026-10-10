import type { PersistenceSink } from "./json-repository.js";
import type { SyncMessage } from "../../domain/entities/sync-message.js";
import { JsonRepository, newId } from "./json-repository.js";
import { nowIso } from "../../domain/services/ticket-crypto.js";

export class SyncMessageRepository extends JsonRepository<SyncMessage> {
  constructor(sink: PersistenceSink) {
    super(sink, "sync_messages");
    this.hydrate(sink.load("sync_messages") as Record<string, SyncMessage>);
  }

  protected idOf(entity: SyncMessage): string {
    return entity.id;
  }

  protected clone(entity: SyncMessage): SyncMessage {
    return { ...entity };
  }

  createMessage(input: Omit<SyncMessage, "id" | "createdAt" | "status">): SyncMessage {
    return this.create({
      id: newId(),
      createdAt: nowIso(),
      status: "PENDING",
      ...input,
    });
  }

  markStatus(id: string, status: SyncMessage["status"]): void {
    this.update(id, { status });
  }

  findByTicket(ticketId: string): SyncMessage[] {
    return this.findAll()
      .filter((m) => m.ticketId === ticketId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}
