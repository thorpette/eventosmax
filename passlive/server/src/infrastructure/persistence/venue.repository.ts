import type { PersistenceSink } from "./json-repository.js";
import type { Venue, CreateVenueInput } from "../../domain/entities/venue.js";
import { JsonRepository, newId } from "./json-repository.js";
import { nowIso } from "../../domain/services/ticket-crypto.js";

export class VenueRepository extends JsonRepository<Venue> {
  constructor(sink: PersistenceSink) {
    super(sink, "venues");
    this.hydrate(sink.load("venues") as Record<string, Venue>);
  }

  protected idOf(entity: Venue): string {
    return entity.id;
  }

  protected clone(entity: Venue): Venue {
    return { ...entity };
  }

  createFromInput(input: CreateVenueInput): Venue {
    return this.create({
      id: newId(),
      status: "ACTIVE",
      createdAt: nowIso(),
      ...input,
    });
  }

  findByLicense(license: string): Venue | undefined {
    return this.findAll().find((v) => v.license === license);
  }
}
