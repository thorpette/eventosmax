import { createJsonSink, type PersistenceSink } from "./json-sink.js";
import { VenueRepository } from "./venue.repository.js";
import { EventRepository } from "./event.repository.js";
import { ClientRepository } from "./client.repository.js";
import { TicketTypeRepository } from "./ticket-type.repository.js";
import { TicketRepository } from "./ticket.repository.js";
import { AccessRecordRepository } from "./access-record.repository.js";
import { SyncMessageRepository } from "./sync-message.repository.js";

export interface Repositories {
  venues: VenueRepository;
  events: EventRepository;
  clients: ClientRepository;
  ticketTypes: TicketTypeRepository;
  tickets: TicketRepository;
  accessRecords: AccessRecordRepository;
  syncMessages: SyncMessageRepository;
}

export function createRepositories(databasePath: string): Repositories {
  const sink: PersistenceSink = createJsonSink(databasePath);
  return {
    venues: new VenueRepository(sink),
    events: new EventRepository(sink),
    clients: new ClientRepository(sink),
    ticketTypes: new TicketTypeRepository(sink),
    tickets: new TicketRepository(sink),
    accessRecords: new AccessRecordRepository(sink),
    syncMessages: new SyncMessageRepository(sink),
  };
}
