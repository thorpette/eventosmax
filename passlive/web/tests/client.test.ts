import { describe, expect, it } from "vitest";
import { getApiKey, ApiError } from "../src/api/client";

describe("api client", () => {
  it("devuelve la API key por defecto", () => {
    localStorage.setItem("passlive.apiKey", "clave-prueba");
    expect(getApiKey()).toBe("clave-prueba");
    localStorage.removeItem("passlive.apiKey");
    expect(getApiKey()).toBe("passlive-dev-key");
  });

  it("construye errores de API con status y código", () => {
    const err = new ApiError(404, "NOT_FOUND", "Entrada no encontrada");
    expect(err.status).toBe(404);
    expect(err.code).toBe("NOT_FOUND");
    expect(err.message).toBe("Entrada no encontrada");
    expect(err).toBeInstanceOf(Error);
  });
});
