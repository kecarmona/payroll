import { UserId } from './user-id';

describe('UserId', () => {
  describe('create', () => {
    it('should generate a UUID v4 string', () => {
      const id = UserId.create();
      expect(id.toString()).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it('should generate unique values on consecutive calls', () => {
      const id1 = UserId.create();
      const id2 = UserId.create();
      expect(id1.toString()).not.toBe(id2.toString());
    });
  });

  describe('from', () => {
    it('should create a UserId from a non-empty string', () => {
      const id = UserId.from('abc-123-def');
      expect(id.toString()).toBe('abc-123-def');
    });

    it('should create equal UserId instances from the same value', () => {
      const id1 = UserId.from('same-value');
      const id2 = UserId.from('same-value');
      expect(id1.equals(id2)).toBe(true);
    });

    it('should throw when constructed with an empty string', () => {
      expect(() => UserId.from('')).toThrow('Id cannot be empty');
    });

    it('should throw when constructed with whitespace-only string', () => {
      expect(() => UserId.from('   ')).toThrow('Id cannot be empty');
    });
  });

  describe('equality', () => {
    it('should be equal for UserId instances with the same value', () => {
      const id1 = UserId.from('user-1');
      const id2 = UserId.from('user-1');
      expect(id1.equals(id2)).toBe(true);
    });

    it('should not be equal for UserId instances with different values', () => {
      const id1 = UserId.from('user-1');
      const id2 = UserId.from('user-2');
      expect(id1.equals(id2)).toBe(false);
    });

    it('should not be equal when compared to undefined', () => {
      const id = UserId.from('user-1');
      expect(id.equals(undefined)).toBe(false);
    });
  });

  describe('type safety', () => {
    it('should return a UserId instance from create()', () => {
      const id = UserId.create();
      expect(id).toBeInstanceOf(UserId);
    });

    it('should return a UserId instance from from()', () => {
      const id = UserId.from('fixed-id');
      expect(id).toBeInstanceOf(UserId);
    });
  });
});
