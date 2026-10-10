import type { NextFunction, Request, Response } from "express";
import { ZodError, type ZodType } from "zod";
import { DomainError } from "../../domain/common/errors.js";

/** Valida req.body con el esquema Zod y lanza 400 con detalle si falla. */
export function validateBody<T>(schema: ZodType<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req.body);
      req.body = parsed;
      next();
    } catch (err) {
      next(err);
    }
  };
}

/** Valida req.params con el esquema Zod. */
export function validateParams<T>(schema: ZodType<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req.params);
      (req as unknown as { validatedParams: T }).validatedParams = parsed;
      next();
    } catch (err) {
      next(err);
    }
  };
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: "VALIDATION_ERROR",
      message: "Los datos de entrada no son válidos",
      details: err.errors.map((e) => ({ path: e.path.join("."), message: e.message })),
    });
    return;
  }
  if (err instanceof DomainError) {
    res.status(err.status).json({ error: err.code, message: err.message });
    return;
  }
  const message = err instanceof Error ? err.message : "Error interno del servidor";
  res.status(500).json({ error: "INTERNAL_ERROR", message });
}
