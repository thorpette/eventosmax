import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { PersistenceSink } from "./json-repository.js";

export type { PersistenceSink };

/**
 * Sink de persistencia en archivo JSON plano.
 * - `:memory:` => solo en RAM (útil en pruebas).
 * - ruta de archivo => persistencia en disco en una única caché JSON.
 */
export function createJsonSink(databasePath: string): PersistenceSink {
  if (databasePath === ":memory:") {
    const cache = new Map<string, Record<string, unknown>>();
    return {
      save(collection, data) {
        cache.set(collection, data);
      },
      load(collection) {
        return cache.get(collection) ?? {};
      },
    };
  }

  const filePath = resolve(databasePath);
  mkdirSync(dirname(filePath), { recursive: true });
  let cache: Record<string, Record<string, unknown>>;
  if (existsSync(filePath)) {
    cache = JSON.parse(readFileSync(filePath, "utf-8")) as Record<
      string,
      Record<string, unknown>
    >;
  } else {
    cache = {};
  }
  const persist = () => writeFileSync(filePath, JSON.stringify(cache, null, 2), "utf-8");
  return {
    save(collection, data) {
      cache[collection] = data;
      persist();
    },
    load(collection) {
      return cache[collection] ?? {};
    },
  };
}
