import { Money } from './money';

describe('Money', () => {
  describe('fromCents', () => {
    it('should create Money from positive cents and valid currency', () => {
      const money = Money.fromCents(1000, 'USD');
      expect(money.amount).toBe(1000);
      expect(money.currency).toBe('USD');
    });

    it('should create Money with zero cents', () => {
      const money = Money.fromCents(0, 'USD');
      expect(money.amount).toBe(0);
      expect(money.currency).toBe('USD');
    });

    it('should throw when cents are negative', () => {
      expect(() => Money.fromCents(-1, 'USD')).toThrow();
    });

    it('should throw when currency is lowercase', () => {
      expect(() => Money.fromCents(100, 'usd')).toThrow();
    });

    it('should throw when currency is 2-letter', () => {
      expect(() => Money.fromCents(100, 'US')).toThrow();
    });

    it('should throw when currency contains non-alpha characters', () => {
      expect(() => Money.fromCents(100, 'US1')).toThrow();
    });

    it('should throw when currency is empty', () => {
      expect(() => Money.fromCents(100, '')).toThrow();
    });
  });

  describe('add', () => {
    it('should add two Money instances with the same currency', () => {
      const a = Money.fromCents(500, 'USD');
      const b = Money.fromCents(300, 'USD');
      const result = a.add(b);
      expect(result.amount).toBe(800);
      expect(result.currency).toBe('USD');
    });

    it('should throw when adding Money with different currencies', () => {
      const usd = Money.fromCents(500, 'USD');
      const eur = Money.fromCents(300, 'EUR');
      expect(() => usd.add(eur)).toThrow();
    });

    it('should not mutate the original instances', () => {
      const a = Money.fromCents(500, 'USD');
      const b = Money.fromCents(300, 'USD');
      a.add(b);
      expect(a.amount).toBe(500);
      expect(b.amount).toBe(300);
    });
  });

  describe('subtract', () => {
    it('should subtract two Money instances with the same currency', () => {
      const a = Money.fromCents(500, 'USD');
      const b = Money.fromCents(200, 'USD');
      const result = a.subtract(b);
      expect(result.amount).toBe(300);
      expect(result.currency).toBe('USD');
    });

    it('should throw when subtracting would produce a negative result', () => {
      const a = Money.fromCents(200, 'USD');
      const b = Money.fromCents(500, 'USD');
      expect(() => a.subtract(b)).toThrow();
    });

    it('should throw when subtracting Money with different currencies', () => {
      const usd = Money.fromCents(500, 'USD');
      const eur = Money.fromCents(200, 'EUR');
      expect(() => usd.subtract(eur)).toThrow();
    });

    it('should not mutate the original instances', () => {
      const a = Money.fromCents(500, 'USD');
      const b = Money.fromCents(200, 'USD');
      a.subtract(b);
      expect(a.amount).toBe(500);
      expect(b.amount).toBe(200);
    });
  });

  describe('equality', () => {
    it('should be equal when same amount and currency', () => {
      const a = Money.fromCents(1000, 'USD');
      const b = Money.fromCents(1000, 'USD');
      expect(a.equals(b)).toBe(true);
    });

    it('should not be equal when different amounts', () => {
      const a = Money.fromCents(1000, 'USD');
      const b = Money.fromCents(2000, 'USD');
      expect(a.equals(b)).toBe(false);
    });

    it('should not be equal when different currencies', () => {
      const a = Money.fromCents(1000, 'USD');
      const b = Money.fromCents(1000, 'EUR');
      expect(a.equals(b)).toBe(false);
    });
  });
});
