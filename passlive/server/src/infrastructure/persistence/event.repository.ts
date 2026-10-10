import type { PersistenceSink } from "./json-repository.js";
import type { Event, CreateEventInput, AgeRestriction } from "../../domain/entities/event.js";
import { JsonRepository, newId } from "./json-repository.js";
import { nowIso } from "../../domain/services/ticket-crypto.js";

export function minAgeFor(restriction: AgeRestriction): number {
  switch (restriction) {
    case "OVER_18":
      return 18;
    case "OVER_21":
      return 21;
    case "NONE":
    default:
      // SUPUESTO: el BPMN no define edad mínima; sin restricción no se exige edad.
      return 0;
  }
}

export class EventRepository extends JsonRepository<Event> {
  constructor(sink: PersistenceSink) {
    super(sink, "events");
    this.hydrate(sink.load("events") as Record<string, Event>);
  }

  protected idOf(entity: Event): string {
    return entity.id;
  }

  protected clone(entity: Event): Event {
    return { ...entity };
  }

  createFromInput(input: CreateEventInput): Event {
    return this.create({
      id: newId(),
      status: input.status ?? "PUBLISHED",
      createdAt: nowIso(),
      ...input,
      minAge: minAgeFor(input.ageRestriction),
    });
  }

  findByCode(code: string): Event | undefined {
    return this.findAll().find((e) => e.code === code);
  }

  findPublished(): Event[] {
    return this.findAll()
      .filter((e) => e.status === "PUBLISHED")
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}
