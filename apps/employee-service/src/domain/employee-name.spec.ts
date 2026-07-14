import { EmployeeName } from './employee-name';

describe('EmployeeName', () => {
  describe('creation', () => {
    it('should create from a valid name', () => {
      const name = EmployeeName.from('John Doe');
      expect(name.value).toBe('John Doe');
    });

    it('should accept a single character name', () => {
      const name = EmployeeName.from('A');
      expect(name.value).toBe('A');
    });

    it('should accept the maximum length name (100 chars)', () => {
      const name = 'A'.repeat(100);
      const employeeName = EmployeeName.from(name);
      expect(employeeName.value).toBe(name);
    });

    it('should trim whitespace from the name', () => {
      const name = EmployeeName.from('  John Doe  ');
      expect(name.value).toBe('John Doe');
    });
  });

  describe('validation', () => {
    it('should throw for empty string', () => {
      expect(() => EmployeeName.from('')).toThrow();
    });

    it('should throw for whitespace-only string', () => {
      expect(() => EmployeeName.from('   ')).toThrow();
    });

    it('should throw for name exceeding 100 characters', () => {
      expect(() => EmployeeName.from('A'.repeat(101))).toThrow();
    });
  });

  describe('equality', () => {
    it('should be equal for the same name', () => {
      const name1 = EmployeeName.from('Jane Doe');
      const name2 = EmployeeName.from('Jane Doe');
      expect(name1.equals(name2)).toBe(true);
    });

    it('should not be equal for different names', () => {
      const name1 = EmployeeName.from('Jane Doe');
      const name2 = EmployeeName.from('John Doe');
      expect(name1.equals(name2)).toBe(false);
    });

    it('should not be equal when compared to undefined', () => {
      const name = EmployeeName.from('Test User');
      expect(name.equals(undefined)).toBe(false);
    });
  });
});
