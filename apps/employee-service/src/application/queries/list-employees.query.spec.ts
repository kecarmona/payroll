/* eslint-disable @typescript-eslint/no-unused-vars */
import { Employee } from '../../domain/employee.entity';
import { EmployeeId } from '../../domain/employee-id';
import { EmployeeEmail } from '../../domain/employee-email';
import { EmployeeName } from '../../domain/employee-name';
import { EmployeePosition } from '../../domain/employee-position';
import { Salary } from '../../domain/salary';
import type { EmployeeRepository } from '../../domain/employee.repository';
import {
  ListEmployeesQuery,
  ListEmployeesHandler,
} from './list-employees.query';

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

describe('ListEmployeesHandler', () => {
  let employeeRepository: InMemoryEmployeeRepository;
  let handler: ListEmployeesHandler;

  beforeEach(() => {
    employeeRepository = new InMemoryEmployeeRepository();
    handler = new ListEmployeesHandler(employeeRepository);
  });

  describe('execute', () => {
    it('should return all employees for the given company', async () => {
      // Arrange: create employees for company-1 and company-2
      const emp1 = Employee.register({
        id: EmployeeId.create(),
        email: EmployeeEmail.from('alice@example.com'),
        name: EmployeeName.from('Alice'),
        position: EmployeePosition.from('Engineer'),
        salary: Salary.from(500000, 'USD'),
        department: 'Engineering',
        companyId: 'company-1',
      });
      const emp2 = Employee.register({
        id: EmployeeId.create(),
        email: EmployeeEmail.from('bob@example.com'),
        name: EmployeeName.from('Bob'),
        position: EmployeePosition.from('Designer'),
        salary: Salary.from(600000, 'USD'),
        department: 'Design',
        companyId: 'company-1',
      });
      const emp3 = Employee.register({
        id: EmployeeId.create(),
        email: EmployeeEmail.from('charlie@example.com'),
        name: EmployeeName.from('Charlie'),
        position: EmployeePosition.from('Manager'),
        salary: Salary.from(800000, 'USD'),
        department: 'Engineering',
        companyId: 'company-2',
      });

      await employeeRepository.save(emp1);
      await employeeRepository.save(emp2);
      await employeeRepository.save(emp3);

      // Act
      const result = await handler.execute(
        new ListEmployeesQuery('company-1'),
      );

      // Assert
      expect(result).toHaveLength(2);
      expect(result.map((e) => e.id)).toContain(emp1.id);
      expect(result.map((e) => e.id)).toContain(emp2.id);
    });

    it('should return an empty array when no employees exist for the company', async () => {
      const result = await handler.execute(
        new ListEmployeesQuery('non-existent-company'),
      );

      expect(result).toEqual([]);
    });

    it('should return only employees matching the requested companyId', async () => {
      // Arrange: employees in company-1 and company-2
      const emp1 = Employee.register({
        id: EmployeeId.create(),
        email: EmployeeEmail.from('dave@example.com'),
        name: EmployeeName.from('Dave'),
        position: EmployeePosition.from('Engineer'),
        salary: Salary.from(500000, 'USD'),
        department: 'Engineering',
        companyId: 'company-1',
      });
      const emp2 = Employee.register({
        id: EmployeeId.create(),
        email: EmployeeEmail.from('eve@example.com'),
        name: EmployeeName.from('Eve'),
        position: EmployeePosition.from('Manager'),
        salary: Salary.from(900000, 'USD'),
        department: 'Engineering',
        companyId: 'company-2',
      });

      await employeeRepository.save(emp1);
      await employeeRepository.save(emp2);

      // Act
      const result = await handler.execute(
        new ListEmployeesQuery('company-2'),
      );

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(emp2.id);
      expect(result[0].email).toBe('eve@example.com');
    });
  });
});
