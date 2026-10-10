export interface Page<T> {
  items: T[];
  total: number;
}

export interface Repository<T, ID extends string | number = string> {
  findAll(): T[];
  findById(id: ID): T | undefined;
  create(entity: T): T;
  update(id: ID, patch: Partial<T>): T | undefined;
  delete(id: ID): boolean;
}
