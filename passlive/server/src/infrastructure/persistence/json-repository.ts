import { randomBytes, randomUUID } from "node:crypto";
import type { Repository } from "../../domain/common/types.js";

export type PersistenceMode = "memory" | "file";

/**
 * Almacén JSON persistente a disco: implementa el puerto Repository del
 * dominio sin dependencias nativas (SUPUESTO: en lugar de SQLite con
 * better-sqlite3 para evitar compilación node-gyp en entornos sin
 * toolchain). Cada escritura se serializa a un archivo JSON.
 *
 * Para migrar a SQLite/PostgreSQL basta con sustituir este módulo: la
 * capa de aplicación solo conoce el puerto `Repository`.
 */
export abstract class JsonRepository<T, ID extends string = string>
  implements Repository<T, ID>
{
  protected items = new Map<ID, T>();

  protected constructor(
    private readonly sink: PersistenceSink,
    private readonly collection: string,
  ) {}

  protected abstract idOf(entity: T): ID;
  protected abstract clone(entity: T): T;

  /** Hidrata el mapa desde disco (llamado por la factoría). */
  hydrate(data: Record<string, T>): void {
    this.items = new Map(Object.entries(data) as Array<[ID, T]>);
  }

  findAll(): T[] {
    return [...this.items.values()].map((e) => this.clone(e));
  }

  findById(id: ID): T | undefined {
    const found = this.items.get(id);
    return found ? this.clone(found) : undefined;
  }

  create(entity: T): T {
    this.items.set(this.idOf(entity), this.clone(entity));
    this.persist();
    return this.clone(entity);
  }

  update(id: ID, patch: Partial<T>): T | undefined {
    const existing = this.items.get(id);
    if (!existing) return undefined;
    const merged = { ...existing, ...patch } as T;
    this.items.set(id, merged);
    this.persist();
    return this.clone(merged);
  }

  delete(id: ID): boolean {
    const deleted = this.items.delete(id);
    if (deleted) this.persist();
    return deleted;
  }

  private persist(): void {
    this.sink.save(this.collection, Object.fromEntries(this.items));
  }

  protected key(): ID {
    return randomBytes(16).toString("hex") as ID;
  }
}

export interface PersistenceSink {
  save(collection: string, data: Record<string, unknown>): void;
  load(collection: string): Record<string, unknown>;
}

export function newId(): string {
  return randomUUID();
}
