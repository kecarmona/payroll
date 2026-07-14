import { EmployeePosition } from './employee-position';

describe('EmployeePosition', () => {
  describe('creation', () => {
    it('should create from a valid position', () => {
      const position = EmployeePosition.from('Software Engineer');
      expect(position.value).toBe('Software Engineer');
    });

    it('should accept a single character position', () => {
      const position = EmployeePosition.from('X');
      expect(position.value).toBe('X');
    });

    it('should accept the maximum length position (100 chars)', () => {
      const value = 'A'.repeat(100);
      const position = EmployeePosition.from(value);
      expect(position.value).toBe(value);
    });

    it('should trim whitespace from the position', () => {
      const position = EmployeePosition.from('  Engineer  ');
      expect(position.value).toBe('Engineer');
    });
  });

  describe('validation', () => {
    it('should throw for empty string', () => {
      expect(() => EmployeePosition.from('')).toThrow();
    });

    it('should throw for whitespace-only string', () => {
      expect(() => EmployeePosition.from('   ')).toThrow();
    });

    it('should throw for position exceeding 100 characters', () => {
      expect(() => EmployeePosition.from('A'.repeat(101))).toThrow();
    });
  });

  describe('equality', () => {
    it('should be equal for the same position', () => {
      const pos1 = EmployeePosition.from('Engineer');
      const pos2 = EmployeePosition.from('Engineer');
      expect(pos1.equals(pos2)).toBe(true);
    });

    it('should not be equal for different positions', () => {
      const pos1 = EmployeePosition.from('Engineer');
      const pos2 = EmployeePosition.from('Manager');
      expect(pos1.equals(pos2)).toBe(false);
    });

    it('should not be equal when compared to undefined', () => {
      const position = EmployeePosition.from('Analyst');
      expect(position.equals(undefined)).toBe(false);
    });
  });
});
