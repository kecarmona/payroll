export abstract class DomainError extends Error {
  readonly domain: string;

  constructor(domain: string, message: string) {
    super(message);
    this.domain = domain;
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends DomainError {
  readonly field: string;

  constructor(field: string, message: string) {
    super('shared-kernel', message);
    this.field = field;
  }
}

export class NotFoundError extends DomainError {
  readonly entityType: string;
  readonly id: string;

  constructor(entityType: string, id: string) {
    super('shared-kernel', `${entityType} with id "${id}" not found`);
    this.entityType = entityType;
    this.id = id;
  }
}
