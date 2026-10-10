import type { PersistenceSink } from "./json-repository.js";
import type { TicketType, CreateTicketTypeInput } from "../../domain/entities/ticket-type.js";
import { JsonRepository, newId } from "./json-repository.js";

export class TicketTypeRepository extends JsonRepository<TicketType> {
  constructor(sink: PersistenceSink) {
    super(sink, "ticket_types");
    this.hydrate(sink.load("ticket_types") as Record<string, TicketType>);
  }

  protected idOf(entity: TicketType): string {
    return entity.id;
  }

  protected clone(entity: TicketType): TicketType {
    return { ...entity };
  }

  createFromInput(input: CreateTicketTypeInput): TicketType {
    return this.create({ id: newId(), sold: 0, ...input });
  }

  findByEvent(eventId: string): TicketType[] {
    return this.findAll().filter((t) => t.eventId === eventId);
  }

  incrementSold(id: string, quantity: number): void {
    const type = this.findById(id);
    if (!type) return;
    this.update(id, { sold: type.sold + quantity });
  }

  decrementSold(id: string, quantity: number): void {
    const type = this.findById(id);
    if (!type) return;
    this.update(id, { sold: Math.max(0, type.sold - quantity) });
  }
}
