import { CompanyId } from './company-id';
import { Id } from './id';

describe('CompanyId', () => {
  describe('create', () => {
    it('should generate a UUID v4 string', () => {
      const id = CompanyId.create();
      expect(id.toString()).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it('should return a CompanyId instance', () => {
      const id = CompanyId.create();
      expect(id).toBeInstanceOf(CompanyId);
    });
  });

  describe('from', () => {
    it('should create a CompanyId from a valid non-empty string', () => {
      const id = CompanyId.from('tenant-abc');
      expect(id).toBeInstanceOf(CompanyId);
      expect(id.toString()).toBe('tenant-abc');
    });

    it('should throw when given an empty string', () => {
      expect(() => CompanyId.from('')).toThrow();
    });
  });

  describe('type safety', () => {
    it('should be an instance of Id', () => {
      const id = CompanyId.create();
      expect(id).toBeInstanceOf(Id);
    });
  });
});
