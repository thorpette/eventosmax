import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import type { AppConfig } from "../../infrastructure/config.js";
import type { Repositories } from "../../infrastructure/persistence/repositories.js";
import { errorHandler } from "./middleware.js";
import { venueRouter } from "./venue.routes.js";
import { eventRouter } from "./event.routes.js";
import { clientRouter } from "./client.routes.js";
import { ticketRouter } from "./ticket.routes.js";
import { salesRouter } from "./sales.routes.js";
import { validationRouter } from "./validation.routes.js";
import { accessControlRouter } from "./access-control.routes.js";
import { syncRouter } from "./sync.routes.js";

/**
 * Autenticación simple por API key (SUPUESTO: el BPMN no define auth).
 * Cabeceras aceptadas: `x-api-key` o `authorization: Bearer <key>`.
 */
function apiKeyGuard(apiKey: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key =
      req.header("x-api-key") ??
      (req.header("authorization")?.startsWith("Bearer ")
        ? req.header("authorization")!.slice(7)
        : undefined);
    if (key !== apiKey) {
      res.status(401).json({ error: "UNAUTHORIZED", message: "API key inválida o ausente" });
      return;
    }
    next();
  };
}

export function createApp(config: AppConfig, repos: Repositories): Express {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "passlive-api", ts: new Date().toISOString() });
  });

  // Rutas abiertas (los locales y terminales validan contra la API central)
  app.use("/api/sync", syncRouter(repos));

  // Rutas protegidas por API key
  const secured = express.Router();
  secured.use(apiKeyGuard(config.apiKey));
  secured.use("/venues", venueRouter(repos));
  secured.use("/events", eventRouter(repos));
  secured.use("/clients", clientRouter(repos));
  secured.use("/tickets", ticketRouter(repos));
  secured.use("/sales", salesRouter(repos));
  secured.use("/validation", validationRouter(repos));
  secured.use("/access-control", accessControlRouter(repos));
  app.use("/api", secured);

  app.use((_req, res) => {
    res.status(404).json({ error: "NOT_FOUND", message: "Recurso no encontrado" });
  });
  app.use(errorHandler);

  return app;
}
