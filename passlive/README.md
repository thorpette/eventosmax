# PassLive — Gestión de Venta y Validación de Entradas para Eventos en Directo

Sistema para la venta de entradas a eventos en directo y su validación en locales mediante
**Bluetooth (BLE)** y **códigos QR**, con control de acceso por edad y tipología VIP.

Generado a partir de los 8 diagramas **BPMN** y las 8 **pantallas Stitch** del repositorio.

---

## 🚀 Inicio rápido (para probar la demo)

> Copia y pega los bloques en orden. Solo necesitas **Git** y **Node.js ≥ 20**.

### 1. Clonar el repositorio

```bash
git clone https://github.com/thorpette/eventosmax.git
cd eventosmax
```

### 2. Instalar dependencias (un único comando)

```bash
npm run install:all
```

> Equivale a `npm install` en `passlive/server` y `passlive/web`. Tarda 1–3 minutos.

### 3. (Opcional) Cargar datos de demostración

```bash
npm run seed
```

Crea un local, un evento **+18** con dos tipologías (General 45 € / VIP 110 €) y dos clientes.
Imprime los IDs creados. Repetible: si ya existen, no duplica nada.

### 4. Arrancar API + frontend a la vez

```bash
npm run demo
```

Abre en el navegador: **<http://localhost:5173>**

| Servicio | URL |
|---|---|
| Frontend | <http://localhost:5173> |
| API (health) | <http://localhost:4000/api/health> |
| API key (si llamas a la API a mano) | cabecera `x-api-key: passlive-dev-key` |

> `npm run demo` arranca ambos procesos en ventanas/terminales del mismo comando.
> Si prefieres dos terminales separadas: `npm run dev:server` (terminal 1) y
> `npm run dev:web` (terminal 2).

### 5. Recorrido de prueba en 2 minutos

1. **`/`** → selecciona el evento → añade 2 General + 1 VIP → elige cliente →
   **«Completar Compra y Emitir Pases»** → verás 3 QR emitidos (212,00 €).
2. **`/validacion`** → pega uno de los QR emitidos → **«Validar entrada»** →
   **«Registrar acceso»** → panel con `RESULTADO: ALLOWED`.
3. **`/restricciones`** → pega el ID de una entrada (o el QR en `/entradas`) →
   **«Verificar edad y tipo»** → ves los tres gateways del BPMN.
4. **`/eventos`, `/locales`, `/clientes`, `/entradas`** → ABM completo.

### 6. (Opcional) Pruebas

```bash
npm test    # 25 backend + 2 frontend
```

### Solución de problemas

| Síntoma | Causa / solución |
|---|---|
| `EADDRINUSE` en el puerto 4000 o 5173 | Otro proceso usa el puerto: `netstat -ano \| findstr :4000` y ciérralo, o cambia `PORT` en `passlive/server/.env` |
| `command not found: git` / `npm` | Instala [Git](https://git-scm.com) y [Node.js ≥ 20 LTS](https://nodejs.org) y reinicia la terminal |
| Frontend no carga datos | Comprueba que la API está en pie: <http://localhost:4000/api/health> debe devolver `{"status":"ok"}` |
| «API key inválida o ausente» | Usa `x-api-key: passlive-dev-key` (o la que fijes en `API_KEY`) |
| Quiero probar desde el móvil en la misma red | Arranca el frontend con `npx vite --host` dentro de `passlive/web` y abre `http://TU_IP_LOCAL:5173` |

---


## Estructura del repositorio

```
eventosmax/
├── README.md
├── docs/
│   └── plan-arquitectura.json          # Plan JSON (resumen BPMN, discrepancias, mapeo, endpoints…)
├── ia/                                  # Fuentes originales (no modificadas)
│   └── gestión-de-venta-y-validación-de-entradas-para-eventos-en-directo/
│       ├── bpmn/                        # 8 diagramas BPMN XML
│       ├── pantallas/                   # 8 pantallas Stitch (HTML + JSON)
│       ├── design-system/               # Sistema de diseño PassLive "Verde Mate"
│       └── files/documentacion/         # Criterios iniciales (entidades detectadas)
└── passlive/                            # Código generado
    ├── package.json                     # Monorepo con workspaces (server, web)
    ├── server/                          # API REST — TypeScript estricto (arquitectura hexagonal)
    │   ├── src/
    │   │   ├── domain/                  # Entidades, servicios y errores del dominio
    │   │   │   ├── common/              #   Puerto Repository, errores de dominio
    │   │   │   ├── entities/            #   Venue, Event, Client, Ticket, TicketType, AccessRecord, SyncMessage
    │   │   │   └── services/            #   access-control, availability, ticket-crypto
    │   │   ├── application/             # (casos de uso expresados en las rutas HTTP)
    │   │   ├── infrastructure/          # Config + repositorios (JSON persistente, intercambiables)
    │   │   │   └── persistence/         #   JsonRepository + sink (disco o memoria)
    │   │   ├── interfaces/
    │   │   │   ├── http/                # Express app, rutas, middleware y manejo de errores
    │   │   │   └── validators/          # Schemas Zod (validación de entrada)
    │   │   └── main.ts                  # Punto de entrada
    │   ├── tests/                       # Vitest: unitarias de dominio + integración API
    │   ├── .env.example
    │   └── package.json
    └── web/                             # Frontend React + Vite + Tailwind (design system PassLive)
        ├── src/
        │   ├── api/                     # Cliente fetch + tipos DTO
        │   ├── components/              # ProcessTracker + ui (SectionCard, botones)
        │   ├── pages/                   # 8 pantallas derivadas de Stitch
        │   ├── shell/AppShell.tsx       # TopNavBar + SideNavBar compartidos
        │   └── hooks/                   # useAsync
        ├── tailwind.config.js           # Tokens M3 "Verde Mate" de las pantallas Stitch
        └── index.html
```

---

## Mapeo BPMN → código

| BPMN | Endpoint(s) | Pantalla |
|---|---|---|
| Proceso de Venta de Entradas | `GET /api/sales/events`, `GET /api/sales/events/:id/availability`, `POST /api/sales/orders`, `POST /api/sales/waitlist` | `SalesPage` |
| Proceso de Validación de Entradas en Acceso | `POST /api/validation/qr`, `POST /api/validation/ble`, `POST /api/validation/access` | `ValidationPage` |
| Control de Acceso por Restricciones | `GET /api/access-control/evaluate/:ticketId`, `POST /api/access-control/deny/:ticketId` | `AccessRestrictionsPage` |
| Colaboración entre Sistema de Venta y Locales | `POST /api/sync/tickets` (MessageFlow_1), `POST /api/sync/confirmations` (MessageFlow_2) | `CollaborationPage` |
| Gestion de Evento | `GET/POST/PUT/DELETE /api/events` | `EventsPage` |
| Gestion de Local | `GET/POST/PUT/DELETE /api/venues` | `VenuesPage` |
| Gestion de Cliente | `GET/POST/PUT/DELETE /api/clients` | `ClientsPage` |
| Gestion de Entrada | `GET/POST/PUT/DELETE /api/tickets` | `TicketsPage` |

---

## Requisitos

- Node.js ≥ 20 (probado con v24)
- npm ≥ 10

No se requieren compiladores nativos: la persistencia usa un almacén **JSON a archivo**
implementado sobre el puerto `Repository` del dominio (ver *SUPUESTOS*).

---

## Pasos de ejecución (detallado)

> Los comandos siguientes se ejecutan desde `passlive/` (el atajo `npm run demo` de arriba es el más rápido).

```bash
# 1. Instalar dependencias
cd passlive/server && npm install
cd ../web && npm install

# 2. Configurar variables de entorno (opcional)
cp server/.env.example server/.env     # valores por defecto válidos

# 3. (Opcional) Datos de demostración: local + evento +18 + clientes
cd ../server && npm run seed           # imprime los IDs creados

# 4. Arrancar API (puerto 4000) — terminal 1
npm run dev:server

# 5. Arrancar el frontend (puerto 5173, proxy /api → 4000) — terminal 2
npm run dev:web
```

Abrir <http://localhost:5173>.

### Pruebas

```bash
cd passlive/server && npm test   # 25 pruebas (dominio + integración API)
cd passlive/web && npm test      # pruebas del cliente API
```

### Compilación de producción

```bash
cd passlive/server && npm run build && npm start
cd passlive/web && npm run build      # output en web/dist
```

---

## Variables de entorno (`server/.env.example`)

| Variable | Descripción | Por defecto |
|---|---|---|
| `PORT` | Puerto de la API | `4000` |
| `NODE_ENV` | Entorno | `development` |
| `DATABASE_PATH` | Ruta del archivo JSON de persistencia (`:memory:` solo RAM) | `./data/passlive.db` |
| `API_KEY` | API key de acceso al panel | `passlive-dev-key` |
| `SALES_API_URL` | URL del Sistema de Venta (sync) | `http://localhost:4000` |
| `DEFAULT_MIN_AGE` | Edad mínima por defecto (no usada si el evento define restricción) | `18` |

La APIkey se envía en la cabecera `x-api-key` (o `Authorization: Bearer <key>`).
Las rutas `/api/health` y `/api/sync/*` son abiertas (los locales las usan para sincronizar).

---

## SUPUESTOS (BPMN no los define)

1. No existe la carpeta `DB/Specs` referenciada en el pseudocódigo derivado: el **BPMN es la
   fuente de verdad** y las pantallas Stitch aportan el detalle de UI.
2. Las pantallas en `ia/.../pantallas/` usan nombres con hash; se han mapeado por su campo `title`.
3. **Pago simulado**: `Task_6 "Procesar pago"` no define pasarela; se confirma transaccionalmente.
4. **Edad mínima**: el BPMN solo dice "¿Evento es para mayores de edad?"; se modela como
   `ageRestriction` configurable por evento (`NONE | OVER_18 | OVER_21`, default sin restricción).
5. **Message flows** (`enviar datos al Local`, `confirmación de validación`) se implementan como
   llamadas HTTP síncronas equivalentes a los mensajes BPMN.
6. **Autenticación**: el BPMN no define usuarios/roles; se usa una API key simple.
7. **Persistencia JSON** en lugar de SQLite nativo para evitar compilación `node-gyp` en entornos
   sin toolchain; migrable a SQLite/PostgreSQL cambiando solo `infrastructure/persistence`.
8. Textos de UI en español; identificadores de código en inglés.

## RIESGOS

- Sin `DB/Specs` no se pueden validar reglas de negocio no modeladas (descuentos, reembolsos…).
- La validación Bluetooth real requiere hardware/beacons: el backend expone la capa de tokens y
  umbrales RSSI; el RSSI se simula en la UI y en la API (`rssi` opcional).
- Los message flows dependen de la disponibilidad de red de ambos sistemas (no modelada).
- El BPMN de Venta no modela errores de pago ni reintentos (fuera de alcance).
- Disponibilidad por sector/tipología y lista de espera se infieren de Stitch (SUPUESTO).
