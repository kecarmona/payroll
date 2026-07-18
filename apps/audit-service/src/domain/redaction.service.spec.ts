import { RedactionService } from './redaction.service';

describe('RedactionService', () => {
  let redactionService: RedactionService;

  beforeEach(() => {
    redactionService = new RedactionService();
  });

  describe('redact', () => {
    it('should return an empty object when given an empty payload', () => {
      const result = redactionService.redact({});

      expect(result).toEqual({});
    });

    it('should preserve non-sensitive fields unchanged', () => {
      const payload = {
        employeeId: 'emp-123',
        companyId: 'comp-1',
        name: 'John Doe',
        salaryCents: 50000,
      };

      const result = redactionService.redact(payload);

      expect(result).toEqual({
        employeeId: 'emp-123',
        companyId: 'comp-1',
        name: 'John Doe',
        salaryCents: 50000,
      });
    });

    it('should redact the ssn field with [REDACTED]', () => {
      const payload = { ssn: '123-45-6789', name: 'John Doe' };

      const result = redactionService.redact(payload);

      expect(result.ssn).toBe('[REDACTED]');
      expect(result.name).toBe('John Doe');
    });

    it('should redact all sensitive fields: ssn, taxId, bankAccount, iban, routingNumber, password, token, secret, refreshToken', () => {
      const payload = {
        ssn: '123-45-6789',
        taxId: 'TX-987654',
        bankAccount: '1234567890',
        iban: 'DE89370400440532013000',
        routingNumber: '021000021',
        password: 'supersecret',
        token: 'eyJhbGciOiJIUzI1NiJ9',
        secret: 'my-api-secret',
        refreshToken: 'rt_abc123',
        name: 'John Doe',
      };

      const result = redactionService.redact(payload);

      expect(result.ssn).toBe('[REDACTED]');
      expect(result.taxId).toBe('[REDACTED]');
      expect(result.bankAccount).toBe('[REDACTED]');
      expect(result.iban).toBe('[REDACTED]');
      expect(result.routingNumber).toBe('[REDACTED]');
      expect(result.password).toBe('[REDACTED]');
      expect(result.token).toBe('[REDACTED]');
      expect(result.secret).toBe('[REDACTED]');
      expect(result.refreshToken).toBe('[REDACTED]');
      expect(result.name).toBe('John Doe');
    });

    it('should handle nested objects by redacting sensitive keys at the top level only', () => {
      const payload = {
        user: { ssn: '123-45-6789', name: 'Jane' },
        password: 'my-pass',
      };

      const result = redactionService.redact(payload);

      expect(result.password).toBe('[REDACTED]');
      expect((result.user as Record<string, unknown>).ssn).toBe('123-45-6789');
    });

    it('should not mutate the original payload object', () => {
      const payload = { ssn: '123-45-6789', name: 'John' };
      const original = { ...payload };

      redactionService.redact(payload);

      expect(payload).toEqual(original);
    });

    it('should handle payloads with no matching sensitive fields', () => {
      const payload = {
        employeeId: 'emp-1',
        department: 'Engineering',
      };

      const result = redactionService.redact(payload);

      expect(result).toEqual(payload);
    });
  });
});
