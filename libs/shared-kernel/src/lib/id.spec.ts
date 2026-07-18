import { Id } from './id';

describe('Id', () => {
  describe('construction', () => {
    it('should create an Id from a non-empty string', () => {
      const id = Id.generate();
      expect(id.toString()).toBeDefined();
      expect(id.toString().length).toBeGreaterThan(0);
    });

    it('should throw when constructed with an empty string', () => {
      expect(() => Id.from('')).toThrow();
    });

    it('should preserve the provided value', () => {
      const id = Id.from('abc-123');
      expect(id.toString()).toBe('abc-123');
    });
  });

  describe('equality', () => {
    it('should be equal when two Ids have the same value', () => {
      const id1 = Id.from('same-id');
      const id2 = Id.from('same-id');
      expect(id1.equals(id2)).toBe(true);
    });

    it('should not be equal when two Ids have different values', () => {
      const id1 = Id.from('id-one');
      const id2 = Id.from('id-two');
      expect(id1.equals(id2)).toBe(false);
    });

    it('should not be equal when compared to undefined', () => {
      const id = Id.from('abc');
      expect(id.equals(undefined)).toBe(false);
    });
  });

  describe('generate', () => {
    it('should generate a UUID v4 string', () => {
      const id = Id.generate();
      expect(id.toString()).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });
  });

  describe('toString', () => {
    it('should return the underlying string value', () => {
      const id = Id.from('test-value');
      expect(id.toString()).toBe('test-value');
      expect(typeof id.toString()).toBe('string');
    });
  });
});
