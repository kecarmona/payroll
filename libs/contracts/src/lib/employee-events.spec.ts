import { EmployeeEventType } from './employee-events';

describe('EmployeeEventType', () => {
  it('should define EmployeeCreated constant', () => {
    expect(EmployeeEventType.EmployeeCreated).toBe('EmployeeCreated');
  });

  it('should define EmployeeSalaryChanged constant', () => {
    expect(EmployeeEventType.EmployeeSalaryChanged).toBe('EmployeeSalaryChanged');
  });

  it('should define EmployeeTerminated constant', () => {
    expect(EmployeeEventType.EmployeeTerminated).toBe('EmployeeTerminated');
  });

  it('should have exactly 3 entries', () => {
    const entries = Object.keys(EmployeeEventType);
    expect(entries).toHaveLength(3);
  });

  it('should have all values matching their keys', () => {
    for (const [key, value] of Object.entries(EmployeeEventType)) {
      expect(key).toBe(value);
    }
  });
});
