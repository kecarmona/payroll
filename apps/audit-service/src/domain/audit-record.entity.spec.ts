import { AuditRecord } from './audit-record.entity';

describe('AuditRecord', () => {
  const validProps = {
    id: 'audit-001',
    eventId: 'evt-abc-123',
    eventType: 'PayrollJobCreated',
    companyId: 'comp-1',
    correlationId: 'corr-xyz',
    payloadSummary: { jobId: 'job-001', period: '2026-01' },
    occurredAt: new Date('2026-07-01T10:00:00Z'),
    recordedAt: new Date('2026-07-01T10:00:01Z'),
  };

  describe('create', () => {
    it('should create an AuditRecord with all required properties', () => {
      const record = AuditRecord.create(validProps);

      expect(record.id).toBe('audit-001');
      expect(record.eventId).toBe('evt-abc-123');
      expect(record.eventType).toBe('PayrollJobCreated');
      expect(record.companyId).toBe('comp-1');
      expect(record.correlationId).toBe('corr-xyz');
      expect(record.payloadSummary).toEqual({ jobId: 'job-001', period: '2026-01' });
      expect(record.occurredAt).toEqual(new Date('2026-07-01T10:00:00Z'));
      expect(record.recordedAt).toEqual(new Date('2026-07-01T10:00:01Z'));
    });

    it('should default recordedAt to the current time when not provided', () => {
      const before = new Date();
      const record = AuditRecord.create({
        id: 'audit-002',
        eventId: 'evt-def',
        eventType: 'EmployeeCreated',
        companyId: 'comp-1',
        correlationId: 'corr-abc',
        payloadSummary: { employeeId: 'emp-1' },
        occurredAt: new Date('2026-07-01T10:00:00Z'),
      });
      const after = new Date();

      expect(record.recordedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(record.recordedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('immutability', () => {
    it('should freeze the instance so properties cannot be modified', () => {
      const record = AuditRecord.create(validProps);

      expect(Object.isFrozen(record)).toBe(true);
    });

    it('should freeze the payloadSummary object', () => {
      const record = AuditRecord.create(validProps);

      expect(Object.isFrozen(record.payloadSummary)).toBe(true);
    });
  });

  describe('equality', () => {
    it('should consider two records equal if they share the same id and companyId', () => {
      const recordA = AuditRecord.create(validProps);
      const recordB = AuditRecord.create({ ...validProps, eventType: 'DifferentEvent' });

      expect(recordA.equals(recordB)).toBe(true);
    });

    it('should consider two records different if they have different ids', () => {
      const recordA = AuditRecord.create(validProps);
      const recordB = AuditRecord.create({ ...validProps, id: 'audit-002' });

      expect(recordA.equals(recordB)).toBe(false);
    });

    it('should return false when compared to undefined', () => {
      const record = AuditRecord.create(validProps);

      expect(record.equals(undefined)).toBe(false);
    });
  });
});
