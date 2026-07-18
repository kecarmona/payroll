/* eslint-disable @typescript-eslint/no-unused-vars */
import type { DomainEvent } from '@payroll/shared-kernel';
import { Employee } from '../domain/employee.entity';
import { EmployeeId } from '../domain/employee-id';
import { EmployeeEmail } from '../domain/employee-email';
import { EmployeeName } from '../domain/employee-name';
import { EmployeePosition } from '../domain/employee-position';
import { Salary } from '../domain/salary';
import { EmploymentStatus } from '../domain/employment-status';
import type { EmployeeRepository } from '../domain/employee.repository';
import type { EventPublisher } from '../domain/event-publisher';
import {
  CreateEmployeeCommand,
  CreateEmployeeHandler,
} from './create-employee.command';
import { EmployeeAlreadyExistsError } from './errors';

// ---------------------------------------------------------------------------
// Fakes
// ---------------------------------------------------------------------------

class InMemoryEmployeeRepository implements EmployeeRepository {
  private employees: Map<string, Employee> = new Map();

  async save(employee: Employee): Promise<void> {
    this.employees.set(employee.id, employee);
  }

  async findById(id: EmployeeId): Promise<Employee | null> {
    return this.employees.get(id.toString()) ?? null;
  }

  async findByEmail(email: string): Promise<Employee | null> {
    for (const employee of this.employees.values()) {
      if (employee.email === email) {
        return employee;
      }
    }
    return null;
  }

  async findByCompanyId(_companyId: string): Promise<Employee[]> {
    return Array.from(this.employees.values()).filter(
      (e) => e.companyId === _companyId,
    );
  }
}

class FakeEventPublisher implements EventPublisher {
  public published: DomainEvent[] = [];

  async publish(event: DomainEvent): Promise<void> {
    this.published.push(event);
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CreateEmployeeHandler', () => {
  let employeeRepository: InMemoryEmployeeRepository;
  let eventPublisher: FakeEventPublisher;
  let handler: CreateEmployeeHandler;

  beforeEach(() => {
    employeeRepository = new InMemoryEmployeeRepository();
    eventPublisher = new FakeEventPublisher();
    handler = new CreateEmployeeHandler(employeeRepository, eventPublisher);
  });

  describe('execute', () => {
    it('should create a new employee and return the employeeId', async () => {
      const command = new CreateEmployeeCommand(
        'john@example.com',
        'John Doe',
        'Engineer',
        500000,
        'USD',
        'Engineering',
        'company-1',
      );

      const employeeId = await handler.execute(command);

      expect(employeeId).toBeDefined();
      expect(employeeId.length).toBeGreaterThan(0);

      // Verify the employee was persisted
      const saved = await employeeRepository.findByEmail('john@example.com');
      expect(saved).not.toBeNull();
      expect(saved!.email).toBe('john@example.com');
      expect(saved!.name).toBe('John Doe');
      expect(saved!.position).toBe('Engineer');
      expect(saved!.department).toBe('Engineering');
      expect(saved!.isActive).toBe(true);
      expect(saved!.companyId).toBe('company-1');
    });

    it('should publish an EmployeeCreated event after saving', async () => {
      const command = new CreateEmployeeCommand(
        'eventcheck@example.com',
        'Jane Doe',
        'Manager',
        750000,
        'USD',
        'Engineering',
        'company-1',
      );

      await handler.execute(command);

      expect(eventPublisher.published).toHaveLength(1);
      expect(eventPublisher.published[0].eventType).toBe('employee.created');
      expect(eventPublisher.published[0].aggregateId).toBeDefined();
      expect(eventPublisher.published[0].companyId).toBe('company-1');
    });

    it('should throw EmployeeAlreadyExistsError when email is taken', async () => {
      // First registration
      const command1 = new CreateEmployeeCommand(
        'duplicate@example.com',
        'Original User',
        'Engineer',
        500000,
        'USD',
        'Engineering',
        'company-1',
      );
      await handler.execute(command1);

      // Second registration with same email
      const command2 = new CreateEmployeeCommand(
        'duplicate@example.com',
        'Duplicate User',
        'Manager',
        600000,
        'USD',
        'Engineering',
        'company-1',
      );

      await expect(handler.execute(command2)).rejects.toThrow(
        EmployeeAlreadyExistsError,
      );
    });

    it('should throw EmployeeAlreadyExistsError with the duplicate email', async () => {
      const command1 = new CreateEmployeeCommand(
        'dup@example.com',
        'First User',
        'Engineer',
        500000,
        'USD',
        'Engineering',
        'company-1',
      );
      await handler.execute(command1);

      const command2 = new CreateEmployeeCommand(
        'dup@example.com',
        'Second User',
        'Engineer',
        500000,
        'USD',
        'Engineering',
        'company-1',
      );

      let error: Error | null = null;
      try {
        await handler.execute(command2);
      } catch (e) {
        error = e as Error;
      }

      expect(error).toBeInstanceOf(EmployeeAlreadyExistsError);
      if (error instanceof EmployeeAlreadyExistsError) {
        expect(error.email).toBe('dup@example.com');
      }
    });
  });
});
