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
  UpdateEmployeeCommand,
  UpdateEmployeeHandler,
} from './update-employee.command';
import { EmployeeNotFoundError } from './errors';

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
// Helpers
// ---------------------------------------------------------------------------

function createEmployee(
  repo: InMemoryEmployeeRepository,
  email: string,
): Employee {
  const employee = Employee.register({
    id: EmployeeId.create(),
    email: EmployeeEmail.from(email),
    name: EmployeeName.from('Original Name'),
    position: EmployeePosition.from('Original Position'),
    salary: Salary.from(500000, 'USD'),
    department: 'Original Dept',
    companyId: 'company-1',
  });
  // Clear registration events since we only want to test update events
  employee.clearEvents();
  repo.save(employee);
  return employee;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('UpdateEmployeeHandler', () => {
  let employeeRepository: InMemoryEmployeeRepository;
  let eventPublisher: FakeEventPublisher;
  let handler: UpdateEmployeeHandler;

  beforeEach(() => {
    employeeRepository = new InMemoryEmployeeRepository();
    eventPublisher = new FakeEventPublisher();
    handler = new UpdateEmployeeHandler(employeeRepository, eventPublisher);
  });

  describe('execute', () => {
    it('should update employee data and return void', async () => {
      const employee = createEmployee(employeeRepository, 'update@example.com');

      const command = new UpdateEmployeeCommand(
        employee.id,
        'Updated Name',
        'Updated Position',
        'Updated Dept',
      );

      await handler.execute(command);

      const saved = await employeeRepository.findByEmail('update@example.com');
      expect(saved).not.toBeNull();
      expect(saved!.name).toBe('Updated Name');
      expect(saved!.position).toBe('Updated Position');
      expect(saved!.department).toBe('Updated Dept');
    });

    it('should publish an EmployeeUpdated event', async () => {
      const employee = createEmployee(employeeRepository, 'event@example.com');

      const command = new UpdateEmployeeCommand(
        employee.id,
        'New Name',
        'New Position',
        'New Dept',
      );

      await handler.execute(command);

      expect(eventPublisher.published).toHaveLength(1);
      expect(eventPublisher.published[0].eventType).toBe('employee.updated');
      expect(eventPublisher.published[0].aggregateId).toBe(employee.id);
    });

    it('should throw EmployeeNotFoundError when employee does not exist', async () => {
      const command = new UpdateEmployeeCommand(
        'non-existent-id',
        'Name',
        'Position',
        'Dept',
      );

      await expect(handler.execute(command)).rejects.toThrow(
        EmployeeNotFoundError,
      );
    });

    it('should throw EmployeeNotFoundError with the searched employeeId', async () => {
      const command = new UpdateEmployeeCommand(
        'unknown-123',
        'Name',
        'Position',
        'Dept',
      );

      let error: Error | null = null;
      try {
        await handler.execute(command);
      } catch (e) {
        error = e as Error;
      }

      expect(error).toBeInstanceOf(EmployeeNotFoundError);
      if (error instanceof EmployeeNotFoundError) {
        expect(error.employeeId).toBe('unknown-123');
      }
    });
  });
});
