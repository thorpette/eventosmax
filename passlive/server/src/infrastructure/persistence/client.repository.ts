import type { PersistenceSink } from "./json-repository.js";
import type { Client, CreateClientInput } from "../../domain/entities/client.js";
import { JsonRepository, newId } from "./json-repository.js";
import { generateBleToken, nowIso } from "../../domain/services/ticket-crypto.js";

export class ClientRepository extends JsonRepository<Client> {
  constructor(sink: PersistenceSink) {
    super(sink, "clients");
    this.hydrate(sink.load("clients") as Record<string, Client>);
  }

  protected idOf(entity: Client): string {
    return entity.id;
  }

  protected clone(entity: Client): Client {
    return { ...entity };
  }

  createFromInput(input: CreateClientInput): Client {
    return this.create({
      id: newId(),
      bleToken: generateBleToken(),
      status: "ACTIVE",
      createdAt: nowIso(),
      ...input,
    });
  }

  findByDni(dni: string): Client | undefined {
    return this.findAll().find((c) => c.dni === dni);
  }

  findByBleToken(token: string): Client | undefined {
    return this.findAll().find((c) => c.bleToken === token);
  }
}
