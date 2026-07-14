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
  ChangeSalaryCommand,
  ChangeSalaryHandler,
} from './change-salary.command';
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
  initialSalaryCents = 500000,
): Employee {
  const employee = Employee.register({
    id: EmployeeId.create(),
    email: EmployeeEmail.from(email),
    name: EmployeeName.from('Test Employee'),
    position: EmployeePosition.from('Engineer'),
    salary: Salary.from(initialSalaryCents, 'USD'),
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

describe('ChangeSalaryHandler', () => {
  let employeeRepository: InMemoryEmployeeRepository;
  let eventPublisher: FakeEventPublisher;
  let handler: ChangeSalaryHandler;

  beforeEach(() => {
    employeeRepository = new InMemoryEmployeeRepository();
    eventPublisher = new FakeEventPublisher();
    handler = new ChangeSalaryHandler(employeeRepository, eventPublisher);
  });

  describe('execute', () => {
    it('should change the employee salary', async () => {
      const employee = createEmployee(employeeRepository, 'salary@example.com');

      const command = new ChangeSalaryCommand(employee.id, 750000, 'USD');

      await handler.execute(command);

      const saved = await employeeRepository.findByEmail('salary@example.com');
      expect(saved).not.toBeNull();
      expect(saved!.salary.amount).toBe(750000);
      expect(saved!.salary.currency).toBe('USD');
    });

    it('should publish an EmployeeSalaryChanged event', async () => {
      const employee = createEmployee(employeeRepository, 'event@example.com');

      const command = new ChangeSalaryCommand(employee.id, 600000, 'USD');

      await handler.execute(command);

      expect(eventPublisher.published).toHaveLength(1);
      expect(eventPublisher.published[0].eventType).toBe(
        'employee.salary.changed',
      );
      expect(eventPublisher.published[0].aggregateId).toBe(employee.id);

      // Verify the payload contains previous and new values
      const event = eventPublisher.published[0] as DomainEvent<{
        previousSalaryCents: number;
        newSalaryCents: number;
        currency: string;
      }>;
      expect(event.payload.previousSalaryCents).toBe(500000);
      expect(event.payload.newSalaryCents).toBe(600000);
      expect(event.payload.currency).toBe('USD');
    });

    it('should throw EmployeeNotFoundError when employee does not exist', async () => {
      const command = new ChangeSalaryCommand('non-existent-id', 750000, 'USD');

      await expect(handler.execute(command)).rejects.toThrow(
        EmployeeNotFoundError,
      );
    });

    it('should throw EmployeeNotFoundError with the searched employeeId', async () => {
      const command = new ChangeSalaryCommand('unknown-123', 750000, 'USD');

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
