import { EmployeeEventType } from '@payroll/contracts';
import { Employee } from './employee.entity';
import { EmployeeId } from './employee-id';
import { EmployeeEmail } from './employee-email';
import { EmployeeName } from './employee-name';
import { EmployeePosition } from './employee-position';
import { Salary } from './salary';
import { EmploymentStatus } from './employment-status';

describe('Employee', () => {
  const companyId = 'company-1';

  const validProps = {
    id: EmployeeId.create(),
    email: EmployeeEmail.from('jane@example.com'),
    name: EmployeeName.from('Jane Doe'),
    position: EmployeePosition.from('Software Engineer'),
    salary: Salary.from(800000, 'USD'),
    department: 'Engineering',
    companyId,
  };

  describe('register', () => {
    it('should create a new active employee and record EmployeeCreated event', () => {
      const employee = Employee.register(validProps);

      expect(employee.id).toBe(validProps.id.toString());
      expect(employee.email).toBe('jane@example.com');
      expect(employee.name).toBe('Jane Doe');
      expect(employee.position).toBe('Software Engineer');
      expect(employee.salary.amount).toBe(800000);
      expect(employee.salary.currency).toBe('USD');
      expect(employee.department).toBe('Engineering');
      expect(employee.status.value).toBe('ACTIVE');
      expect(employee.isActive).toBe(true);

      const events = employee.pullEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe(EmployeeEventType.EMPLOYEE_CREATED);
      expect(events[0].aggregateId).toBe(validProps.id.toString());
    });

    it('should start with version 0', () => {
      const employee = Employee.register(validProps);
      expect(employee.version).toBe(0);
    });
  });

  describe('reconstitute', () => {
    it('should recreate an employee from persisted data without events', () => {
      const employee = Employee.reconstitute({
        id: validProps.id.toString(),
        email: validProps.email,
        name: validProps.name,
        position: validProps.position,
        salary: validProps.salary,
        department: 'Engineering',
        status: EmploymentStatus.ACTIVE,
        companyId,
        version: 3,
      });

      expect(employee.id).toBe(validProps.id.toString());
      expect(employee.email).toBe('jane@example.com');
      expect(employee.name).toBe('Jane Doe');
      expect(employee.version).toBe(3);

      const events = employee.pullEvents();
      expect(events).toHaveLength(0);
    });
  });

  describe('updateData', () => {
    it('should update employee fields and record EmployeeUpdated event', () => {
      const employee = Employee.register(validProps);
      employee.pullEvents(); // clear registration events

      const newName = EmployeeName.from('Jane Smith');
      const newPosition = EmployeePosition.from('Senior Engineer');
      const newDepartment = 'R&D';

      employee.updateData(newName, newPosition, newDepartment);

      expect(employee.name).toBe('Jane Smith');
      expect(employee.position).toBe('Senior Engineer');
      expect(employee.department).toBe('R&D');

      const events = employee.pullEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe(EmployeeEventType.EMPLOYEE_UPDATED);
      expect(events[0].aggregateId).toBe(validProps.id.toString());
    });

    it('should throw DomainError when updating a terminated employee', () => {
      const employee = Employee.register(validProps);
      employee.pullEvents();
      employee.terminate();
      employee.pullEvents();

      expect(() => {
        employee.updateData(
          EmployeeName.from('New Name'),
          EmployeePosition.from('New Position'),
          'New Dept',
        );
      }).toThrow('cannot be modified');
    });
  });

  describe('changeSalary', () => {
    it('should update salary and record EmployeeSalaryChanged event', () => {
      const employee = Employee.register(validProps);
      employee.pullEvents(); // clear registration events

      const newSalary = Salary.from(900000, 'USD');
      employee.changeSalary(newSalary, '2026-08-01');

      expect(employee.salary.amount).toBe(900000);
      expect(employee.salary.currency).toBe('USD');

      const events = employee.pullEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe(EmployeeEventType.EMPLOYEE_SALARY_CHANGED);
      expect(events[0].aggregateId).toBe(validProps.id.toString());
    });

    it('should throw DomainError when changing salary of a terminated employee', () => {
      const employee = Employee.register(validProps);
      employee.pullEvents();
      employee.terminate();
      employee.pullEvents();

      expect(() => {
        employee.changeSalary(Salary.from(1000000, 'USD'), '2026-09-01');
      }).toThrow('cannot be modified');
    });
  });

  describe('terminate', () => {
    it('should set status to TERMINATED and record EmployeeTerminated event', () => {
      const employee = Employee.register(validProps);
      employee.pullEvents(); // clear registration events

      employee.terminate();

      expect(employee.status.value).toBe('TERMINATED');
      expect(employee.isActive).toBe(false);

      const events = employee.pullEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe(EmployeeEventType.EMPLOYEE_TERMINATED);
      expect(events[0].aggregateId).toBe(validProps.id.toString());
    });

    it('should be idempotent when terminating an already terminated employee', () => {
      const employee = Employee.register(validProps);
      employee.pullEvents(); // clear registration events

      employee.terminate();
      const eventsAfterFirst = employee.pullEvents();
      expect(eventsAfterFirst).toHaveLength(1);

      employee.terminate();
      const eventsAfterSecond = employee.pullEvents();
      expect(eventsAfterSecond).toHaveLength(0);
    });
  });

  describe('equality', () => {
    it('should be equal for employees with the same id and companyId', () => {
      const emp1 = Employee.register(validProps);
      const emp2 = Employee.reconstitute({
        id: validProps.id.toString(),
        email: validProps.email,
        name: validProps.name,
        position: validProps.position,
        salary: validProps.salary,
        department: 'Engineering',
        status: EmploymentStatus.ACTIVE,
        companyId,
        version: 0,
      });

      expect(emp1.equals(emp2)).toBe(true);
    });

    it('should not be equal when compared to undefined', () => {
      const employee = Employee.register(validProps);
      expect(employee.equals(undefined)).toBe(false);
    });
  });
});
