import { EmployeeId } from './employee-id';

describe('EmployeeId', () => {
  describe('create', () => {
    it('should generate a UUID v4 string', () => {
      const id = EmployeeId.create();
      expect(id.toString()).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it('should generate unique values on consecutive calls', () => {
      const id1 = EmployeeId.create();
      const id2 = EmployeeId.create();
      expect(id1.toString()).not.toBe(id2.toString());
    });
  });

  describe('from', () => {
    it('should create an EmployeeId from a non-empty string', () => {
      const id = EmployeeId.from('emp-123');
      expect(id.toString()).toBe('emp-123');
    });

    it('should create equal EmployeeId instances from the same value', () => {
      const id1 = EmployeeId.from('same-id');
      const id2 = EmployeeId.from('same-id');
      expect(id1.equals(id2)).toBe(true);
    });

    it('should throw when constructed with an empty string', () => {
      expect(() => EmployeeId.from('')).toThrow('Id cannot be empty');
    });

    it('should throw when constructed with whitespace-only string', () => {
      expect(() => EmployeeId.from('   ')).toThrow('Id cannot be empty');
    });
  });

  describe('equality', () => {
    it('should be equal for EmployeeId instances with the same value', () => {
      const id1 = EmployeeId.from('emp-1');
      const id2 = EmployeeId.from('emp-1');
      expect(id1.equals(id2)).toBe(true);
    });

    it('should not be equal for EmployeeId instances with different values', () => {
      const id1 = EmployeeId.from('emp-1');
      const id2 = EmployeeId.from('emp-2');
      expect(id1.equals(id2)).toBe(false);
    });

    it('should not be equal when compared to undefined', () => {
      const id = EmployeeId.from('emp-1');
      expect(id.equals(undefined)).toBe(false);
    });
  });

  describe('type safety', () => {
    it('should return an EmployeeId instance from create()', () => {
      const id = EmployeeId.create();
      expect(id).toBeInstanceOf(EmployeeId);
    });

    it('should return an EmployeeId instance from from()', () => {
      const id = EmployeeId.from('fixed-id');
      expect(id).toBeInstanceOf(EmployeeId);
    });
  });
});
