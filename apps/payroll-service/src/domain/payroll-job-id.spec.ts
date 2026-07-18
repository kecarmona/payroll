import { PayrollJobId } from './payroll-job-id';

describe('PayrollJobId', () => {
  describe('create', () => {
    it('should generate a UUID v4 string', () => {
      const id = PayrollJobId.create();
      expect(id.toString()).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it('should generate unique values on consecutive calls', () => {
      const id1 = PayrollJobId.create();
      const id2 = PayrollJobId.create();
      expect(id1.toString()).not.toBe(id2.toString());
    });
  });

  describe('from', () => {
    it('should create a PayrollJobId from a non-empty string', () => {
      const id = PayrollJobId.from('job-123');
      expect(id.toString()).toBe('job-123');
    });

    it('should create equal instances from the same value', () => {
      const id1 = PayrollJobId.from('same-id');
      const id2 = PayrollJobId.from('same-id');
      expect(id1.equals(id2)).toBe(true);
    });

    it('should throw when constructed with an empty string', () => {
      expect(() => PayrollJobId.from('')).toThrow('Id cannot be empty');
    });

    it('should throw when constructed with whitespace-only string', () => {
      expect(() => PayrollJobId.from('   ')).toThrow('Id cannot be empty');
    });
  });

  describe('equality', () => {
    it('should be equal for instances with the same value', () => {
      const id1 = PayrollJobId.from('job-1');
      const id2 = PayrollJobId.from('job-1');
      expect(id1.equals(id2)).toBe(true);
    });

    it('should not be equal for instances with different values', () => {
      const id1 = PayrollJobId.from('job-1');
      const id2 = PayrollJobId.from('job-2');
      expect(id1.equals(id2)).toBe(false);
    });

    it('should not be equal when compared to undefined', () => {
      const id = PayrollJobId.from('job-1');
      expect(id.equals(undefined)).toBe(false);
    });
  });

  describe('type safety', () => {
    it('should return a PayrollJobId instance from create()', () => {
      const id = PayrollJobId.create();
      expect(id).toBeInstanceOf(PayrollJobId);
    });

    it('should return a PayrollJobId instance from from()', () => {
      const id = PayrollJobId.from('fixed-id');
      expect(id).toBeInstanceOf(PayrollJobId);
    });
  });
});
