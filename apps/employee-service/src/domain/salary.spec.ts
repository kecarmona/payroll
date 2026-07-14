import { Salary } from './salary';

describe('Salary', () => {
  describe('creation', () => {
    it('should create from an amount in cents and currency', () => {
      const salary = Salary.from(500000, 'USD');
      expect(salary.amount).toBe(500000);
      expect(salary.currency).toBe('USD');
    });

    it('should accept zero salary', () => {
      const salary = Salary.from(0, 'USD');
      expect(salary.amount).toBe(0);
      expect(salary.currency).toBe('USD');
    });

    it('should accept different currencies', () => {
      const salary = Salary.from(100000, 'EUR');
      expect(salary.amount).toBe(100000);
      expect(salary.currency).toBe('EUR');
    });

    it('should accept ARS currency', () => {
      const salary = Salary.from(15000000, 'ARS');
      expect(salary.currency).toBe('ARS');
    });
  });

  describe('validation', () => {
    it('should throw for negative amount', () => {
      expect(() => Salary.from(-100, 'USD')).toThrow();
    });

    it('should throw for empty currency', () => {
      expect(() => Salary.from(50000, '')).toThrow();
    });

    it('should throw for invalid currency code (too short)', () => {
      expect(() => Salary.from(50000, 'US')).toThrow();
    });

    it('should throw for invalid currency code (lowercase)', () => {
      expect(() => Salary.from(50000, 'usd')).toThrow();
    });
  });

  describe('equality', () => {
    it('should be equal for the same amount and currency', () => {
      const s1 = Salary.from(100000, 'USD');
      const s2 = Salary.from(100000, 'USD');
      expect(s1.equals(s2)).toBe(true);
    });

    it('should not be equal for different amounts', () => {
      const s1 = Salary.from(50000, 'USD');
      const s2 = Salary.from(100000, 'USD');
      expect(s1.equals(s2)).toBe(false);
    });

    it('should not be equal for different currencies', () => {
      const s1 = Salary.from(100000, 'USD');
      const s2 = Salary.from(100000, 'EUR');
      expect(s1.equals(s2)).toBe(false);
    });
  });
});
