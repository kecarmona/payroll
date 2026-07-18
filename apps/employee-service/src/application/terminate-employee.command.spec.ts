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
  TerminateEmployeeCommand,
  TerminateEmployeeHandler,
} from './terminate-employee.command';
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
    name: EmployeeName.from('Test Employee'),
    position: EmployeePosition.from('Engineer'),
    salary: Salary.from(500000, 'USD'),
    department: 'Engineering',
    companyId: 'company-1',
  });
  employee.clearEvents();
  repo.save(employee);
  return employee;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TerminateEmployeeHandler', () => {
  let employeeRepository: InMemoryEmployeeRepository;
  let eventPublisher: FakeEventPublisher;
  let handler: TerminateEmployeeHandler;

  beforeEach(() => {
    employeeRepository = new InMemoryEmployeeRepository();
    eventPublisher = new FakeEventPublisher();
    handler = new TerminateEmployeeHandler(employeeRepository, eventPublisher);
  });

  describe('execute', () => {
    it('should terminate an active employee', async () => {
      const employee = createEmployee(employeeRepository, 'terminate@example.com');
      expect(employee.isActive).toBe(true);

      const command = new TerminateEmployeeCommand(employee.id);

      await handler.execute(command);

      const saved = await employeeRepository.findByEmail('terminate@example.com');
      expect(saved).not.toBeNull();
      expect(saved!.isActive).toBe(false);
    });

    it('should publish an EmployeeTerminated event', async () => {
      const employee = createEmployee(employeeRepository, 'event@example.com');

      const command = new TerminateEmployeeCommand(employee.id);

      await handler.execute(command);

      expect(eventPublisher.published).toHaveLength(1);
      expect(eventPublisher.published[0].eventType).toBe(
        'employee.terminated',
      );
      expect(eventPublisher.published[0].aggregateId).toBe(employee.id);
    });

    it('should throw EmployeeNotFoundError when employee does not exist', async () => {
      const command = new TerminateEmployeeCommand('non-existent-id');

      await expect(handler.execute(command)).rejects.toThrow(
        EmployeeNotFoundError,
      );
    });

    it('should be idempotent on re-termination (no additional events)', async () => {
      const employee = createEmployee(employeeRepository, 'idempotent@example.com');

      // First termination
      const command1 = new TerminateEmployeeCommand(employee.id);
      await handler.execute(command1);

      expect(eventPublisher.published).toHaveLength(1);

      // Second termination — should be a no-op
      const command2 = new TerminateEmployeeCommand(employee.id);
      await handler.execute(command2);

      // Still only 1 event — no new event for idempotent termination
      expect(eventPublisher.published).toHaveLength(1);
    });
  });
});
