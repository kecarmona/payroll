import { EmployeeEventType } from '@payroll/contracts';
import { EmployeeCreatedEvent } from './employee-created.event';
import { EmployeeUpdatedEvent } from './employee-updated.event';
import { EmployeeSalaryChangedEvent } from './employee-salary-changed.event';
import { EmployeeTerminatedEvent } from './employee-terminated.event';

describe('EmployeeCreatedEvent', () => {
  it('should create an EmployeeCreated domain event', () => {
    const event = new EmployeeCreatedEvent({
      employeeId: 'emp-123',
      name: 'John Doe',
      email: 'john@example.com',
      companyId: 'comp-1',
      position: 'Engineer',
      department: 'Engineering',
      salaryCents: 500000,
      salaryCurrency: 'USD',
    });

    expect(event.eventType).toBe(EmployeeEventType.EMPLOYEE_CREATED);
    expect(event.version).toBe(1);
    expect(event.aggregateId).toBe('emp-123');
    expect(event.companyId).toBe('comp-1');
    expect(event.eventId).toBeDefined();
    expect(event.occurredAt).toBeInstanceOf(Date);
    expect(event.payload).toEqual({
      employeeId: 'emp-123',
      name: 'John Doe',
      email: 'john@example.com',
      companyId: 'comp-1',
      position: 'Engineer',
      department: 'Engineering',
      salaryCents: 500000,
      salaryCurrency: 'USD',
    });
  });
});

describe('EmployeeUpdatedEvent', () => {
  it('should create an EmployeeUpdated domain event', () => {
    const event = new EmployeeUpdatedEvent({
      employeeId: 'emp-123',
      companyId: 'comp-1',
      changedFields: ['name', 'position'],
      updatedAt: '2026-07-14T12:00:00.000Z',
    });

    expect(event.eventType).toBe(EmployeeEventType.EMPLOYEE_UPDATED);
    expect(event.version).toBe(1);
    expect(event.aggregateId).toBe('emp-123');
    expect(event.companyId).toBe('comp-1');
    expect(event.eventId).toBeDefined();
    expect(event.occurredAt).toBeInstanceOf(Date);
    expect(event.payload).toEqual({
      employeeId: 'emp-123',
      companyId: 'comp-1',
      changedFields: ['name', 'position'],
      updatedAt: '2026-07-14T12:00:00.000Z',
    });
  });
});

describe('EmployeeSalaryChangedEvent', () => {
  it('should create an EmployeeSalaryChanged domain event', () => {
    const event = new EmployeeSalaryChangedEvent({
      employeeId: 'emp-123',
      companyId: 'comp-1',
      previousSalaryCents: 400000,
      newSalaryCents: 500000,
      currency: 'USD',
      effectiveDate: '2026-07-01',
    });

    expect(event.eventType).toBe(EmployeeEventType.EMPLOYEE_SALARY_CHANGED);
    expect(event.version).toBe(1);
    expect(event.aggregateId).toBe('emp-123');
    expect(event.companyId).toBe('comp-1');
    expect(event.eventId).toBeDefined();
    expect(event.occurredAt).toBeInstanceOf(Date);
    expect(event.payload).toEqual({
      employeeId: 'emp-123',
      companyId: 'comp-1',
      previousSalaryCents: 400000,
      newSalaryCents: 500000,
      currency: 'USD',
      effectiveDate: '2026-07-01',
    });
  });
});

describe('EmployeeTerminatedEvent', () => {
  it('should create an EmployeeTerminated domain event', () => {
    const event = new EmployeeTerminatedEvent({
      employeeId: 'emp-123',
      companyId: 'comp-1',
    });

    expect(event.eventType).toBe(EmployeeEventType.EMPLOYEE_TERMINATED);
    expect(event.version).toBe(1);
    expect(event.aggregateId).toBe('emp-123');
    expect(event.companyId).toBe('comp-1');
    expect(event.eventId).toBeDefined();
    expect(event.occurredAt).toBeInstanceOf(Date);
    expect(event.payload.employeeId).toBe('emp-123');
    expect(event.payload.companyId).toBe('comp-1');
    expect(event.payload.terminatedAt).toBeDefined();
    expect(typeof event.payload.terminatedAt).toBe('string');
  });
});
