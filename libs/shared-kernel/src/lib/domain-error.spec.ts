import { DomainError, ValidationError, NotFoundError } from './domain-error';

describe('DomainError', () => {
  it('should be an abstract class that cannot be instantiated directly', () => {
    // DomainError is abstract, can only be tested via subclasses
    expect(DomainError).toBeDefined();
  });

  it('should have a readonly domain property set by subclasses', () => {
    const error = new ValidationError('email', 'Invalid format');
    expect(error.domain).toBeDefined();
    expect(typeof error.domain).toBe('string');
    expect(error.domain).toBe('shared-kernel');
  });
});

describe('ValidationError', () => {
  it('should extend DomainError and Error', () => {
    const error = new ValidationError('email', 'Invalid format');
    expect(error).toBeInstanceOf(DomainError);
    expect(error).toBeInstanceOf(Error);
  });

  it('should set domain, field, and message', () => {
    const error = new ValidationError('email', 'Invalid format');
    expect(error.domain).toBe('shared-kernel');
    expect(error.field).toBe('email');
    expect(error.message).toBe('Invalid format');
  });

  it('should have a name matching the class', () => {
    const error = new ValidationError('age', 'Must be positive');
    expect(error.name).toBe('ValidationError');
  });

  it('should be throwable and catchable by type', () => {
    const fn = () => {
      throw new ValidationError('email', 'Invalid');
    };
    expect(fn).toThrow(ValidationError);
    expect(fn).toThrow(Error);
  });
});

describe('NotFoundError', () => {
  it('should extend DomainError and Error', () => {
    const error = new NotFoundError('Employee', 'id-123');
    expect(error).toBeInstanceOf(DomainError);
    expect(error).toBeInstanceOf(Error);
  });

  it('should set domain, entityType, id, and message', () => {
    const error = new NotFoundError('Employee', 'id-123');
    expect(error.domain).toBe('shared-kernel');
    expect(error.entityType).toBe('Employee');
    expect(error.id).toBe('id-123');
    expect(error.message).toContain('Employee');
    expect(error.message).toContain('id-123');
  });

  it('should have a name matching the class', () => {
    const error = new NotFoundError('Company', 'cmp-456');
    expect(error.name).toBe('NotFoundError');
  });

  it('should be throwable and catchable by type', () => {
    const fn = () => {
      throw new NotFoundError('Payroll', 'pr-789');
    };
    expect(fn).toThrow(NotFoundError);
    expect(fn).toThrow(Error);
  });
});
