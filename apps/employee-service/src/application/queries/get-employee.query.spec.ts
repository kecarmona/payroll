/* eslint-disable @typescript-eslint/no-unused-vars */
import { Employee } from '../../domain/employee.entity';
import { EmployeeId } from '../../domain/employee-id';
import { EmployeeEmail } from '../../domain/employee-email';
import { EmployeeName } from '../../domain/employee-name';
import { EmployeePosition } from '../../domain/employee-position';
import { Salary } from '../../domain/salary';
import type { EmployeeRepository } from '../../domain/employee.repository';
import { EmployeeNotFoundError } from '../errors';
import { GetEmployeeQuery, GetEmployeeHandler } from './get-employee.query';

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

  async findByEmail(_email: string): Promise<Employee | null> {
    for (const employee of this.employees.values()) {
      if (employee.email === _email) {
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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GetEmployeeHandler', () => {
  let employeeRepository: InMemoryEmployeeRepository;
  let handler: GetEmployeeHandler;

  beforeEach(() => {
    employeeRepository = new InMemoryEmployeeRepository();
    handler = new GetEmployeeHandler(employeeRepository);
  });

  describe('execute', () => {
    it('should return the employee when found', async () => {
      // Arrange: create and persist an employee
      const id = EmployeeId.create();
      const employee = Employee.register({
        id,
        email: EmployeeEmail.from('jane@example.com'),
        name: EmployeeName.from('Jane Doe'),
        position: EmployeePosition.from('Manager'),
        salary: Salary.from(750000, 'USD'),
        department: 'Engineering',
        companyId: 'company-1',
      });
      await employeeRepository.save(employee);

      // Act
      const result = await handler.execute(
        new GetEmployeeQuery(id.toString()),
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(id.toString());
      expect(result.email).toBe('jane@example.com');
      expect(result.name).toBe('Jane Doe');
      expect(result.position).toBe('Manager');
      expect(result.department).toBe('Engineering');
      expect(result.isActive).toBe(true);
      expect(result.companyId).toBe('company-1');
    });

    it('should throw EmployeeNotFoundError when employee does not exist', async () => {
      const query = new GetEmployeeQuery('non-existent-id');

      await expect(handler.execute(query)).rejects.toThrow(
        EmployeeNotFoundError,
      );
    });

    it('should throw EmployeeNotFoundError with the searched employeeId', async () => {
      const searchedId = 'missing-employee-id';

      try {
        await handler.execute(new GetEmployeeQuery(searchedId));
      } catch (error) {
        expect(error).toBeInstanceOf(EmployeeNotFoundError);
        if (error instanceof EmployeeNotFoundError) {
          expect(error.employeeId).toBe(searchedId);
        }
      }
    });
  });
});
