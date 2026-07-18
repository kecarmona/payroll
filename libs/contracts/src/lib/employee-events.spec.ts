import { EmployeeEventType } from './employee-events';

describe('EmployeeEventType', () => {
  it('should define EMPLOYEE_CREATED constant', () => {
    expect(EmployeeEventType.EMPLOYEE_CREATED).toBe('employee.created');
  });

  it('should define EMPLOYEE_UPDATED constant', () => {
    expect(EmployeeEventType.EMPLOYEE_UPDATED).toBe('employee.updated');
  });

  it('should define EMPLOYEE_SALARY_CHANGED constant', () => {
    expect(EmployeeEventType.EMPLOYEE_SALARY_CHANGED).toBe('employee.salary.changed');
  });

  it('should define EMPLOYEE_TERMINATED constant', () => {
    expect(EmployeeEventType.EMPLOYEE_TERMINATED).toBe('employee.terminated');
  });

  it('should have exactly 4 entries', () => {
    const entries = Object.keys(EmployeeEventType);
    expect(entries).toHaveLength(4);
  });
});
