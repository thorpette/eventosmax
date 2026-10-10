import type { PersistenceSink } from "./json-repository.js";
import type {
  AccessRecord,
  CreateAccessRecordInput,
} from "../../domain/entities/access-record.js";
import { JsonRepository, newId } from "./json-repository.js";
import { nowIso } from "../../domain/services/ticket-crypto.js";

export class AccessRecordRepository extends JsonRepository<AccessRecord> {
  constructor(sink: PersistenceSink) {
    super(sink, "access_records");
    this.hydrate(sink.load("access_records") as Record<string, AccessRecord>);
  }

  protected idOf(entity: AccessRecord): string {
    return entity.id;
  }

  protected clone(entity: AccessRecord): AccessRecord {
    return { ...entity };
  }

  createFromInput(input: CreateAccessRecordInput): AccessRecord {
    return this.create({
      id: newId(),
      validatedAt: nowIso(),
      reason: input.reason ?? null,
      ageVerified: input.ageVerified ?? false,
      route: input.route ?? null,
      operatorNote: input.operatorNote ?? null,
      ticketId: input.ticketId,
      method: input.method,
      result: input.result,
    });
  }

  findByTicket(ticketId: string): AccessRecord[] {
    return this.findAll()
      .filter((r) => r.ticketId === ticketId)
      .sort((a, b) => b.validatedAt.localeCompare(a.validatedAt));
  }
}
