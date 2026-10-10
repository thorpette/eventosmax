/**
 * Seed de datos de demostración: crea un local, un evento (+18) y dos clientes.
 * Uso: `npx tsx src/seed.ts` con la API detenida o en marcha (misma ruta de datos).
 */
import { loadConfig } from "./infrastructure/config.js";
import { createRepositories } from "./infrastructure/persistence/repositories.js";

const config = loadConfig();
const repos = createRepositories(config.databasePath);

const venue =
  repos.venues.findByLicense("LIC-MAD-2024-8891") ??
  repos.venues.createFromInput({
    name: "Teatro Kapital Madrid",
    license: "LIC-MAD-2024-8891",
    address: "Calle de Atocha 125, Madrid",
    city: "Madrid",
    maxCapacity: 2400,
    capacityPercent: 85,
    rssiThreshold: -65,
    qrRotationSeconds: 15,
    validationTechnology: "DUAL",
  });

const event =
  repos.events.findByCode("ERP-NOCT-5582") ??
  (() => {
    const created = repos.events.createFromInput({
      name: "Nocturna Sound Wave: Festival Electrónico",
      code: "ERP-NOCT-5582",
      date: "2026-07-18",
      startTime: "21:00",
      endTime: "04:30",
      venueId: venue.id,
      ageRestriction: "OVER_18",
      capacity: 2250,
      basePrice: 45,
    });
    repos.ticketTypes.createFromInput({
      eventId: created.id,
      name: "Entrada General - Pista Completa",
      category: "GENERAL",
      price: 45,
      fees: 3.5,
      capacity: Math.floor(created.capacity * 0.8),
    });
    repos.ticketTypes.createFromInput({
      eventId: created.id,
      name: "Acreditación VIP Gold + Backstage",
      category: "VIP",
      price: 110,
      fees: 5,
      capacity: Math.floor(created.capacity * 0.2),
    });
    return created;
  })();

const client1 =
  repos.clients.findByDni("48291048K") ??
  repos.clients.createFromInput({
    name: "Carlos Mendoza Gil",
    dni: "48291048K",
    birthDate: "1998-05-14",
    email: "carlos.mendoza@passlive.app",
    phone: "+34 612 345 678",
  });

const client2 =
  repos.clients.findByDni("71289401B") ??
  repos.clients.createFromInput({
    name: "Mateo Ramos Loyola",
    dni: "71289401B",
    birthDate: "2007-06-18", // menor de 18 en 2026 -> denegación por restricción
    email: "mateo.ramos@passlive.app",
    phone: "+34 699 845 213",
  });

console.log(
  JSON.stringify(
    {
      venue: { id: venue.id, name: venue.name },
      event: { id: event.id, name: event.name, minAge: event.minAge },
      clients: [
        { id: client1.id, name: client1.name, bleToken: client1.bleToken },
        { id: client2.id, name: client2.name, bleToken: client2.bleToken },
      ],
      ticketTypes: repos.ticketTypes.findByEvent(event.id).map((t) => ({
        id: t.id,
        name: t.name,
        category: t.category,
        price: t.price,
        capacity: t.capacity,
      })),
    },
    null,
    2,
  ),
);
