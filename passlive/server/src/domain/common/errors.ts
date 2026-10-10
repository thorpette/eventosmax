export class DomainError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code = "DOMAIN_ERROR", status = 400) {
    super(message);
    this.name = "DomainError";
    this.code = code;
    this.status = status;
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string, id: string | number) {
    super(`${resource} con id ${id} no encontrado`, "NOT_FOUND", 404);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends DomainError {
  constructor(message: string) {
    super(message, "CONFLICT", 409);
    this.name = "ConflictError";
  }
}

export class BusinessRuleError extends DomainError {
  constructor(message: string) {
    super(message, "BUSINESS_RULE_VIOLATION", 422);
    this.name = "BusinessRuleError";
  }
}
