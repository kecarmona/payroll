import { RecordAuditEventHandler } from './record-audit-event.handler';
import { AuditRecordRepository } from '../domain/audit-record.repository';
import { ProcessedEventStore } from '../domain/processed-event-store';
import { RedactionService } from '../domain/redaction.service';

describe('RecordAuditEventHandler', () => {
  let handler: RecordAuditEventHandler;
  let mockRepository: jest.Mocked<AuditRecordRepository>;
  let mockProcessedStore: jest.Mocked<ProcessedEventStore>;
  let redactionService: RedactionService;

  const validEvent = {
    eventId: 'evt-abc-123',
    eventType: 'PayrollJobCreated',
    companyId: 'comp-1',
    correlationId: 'corr-xyz',
    payload: { jobId: 'job-001', period: '2026-01', ssn: '123-45-6789' },
    occurredAt: new Date('2026-07-01T10:00:00Z'),
  };

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      existsByEventId: jest.fn(),
    };

    mockProcessedStore = {
      markProcessed: jest.fn(),
      isProcessed: jest.fn(),
    };

    redactionService = new RedactionService();
    handler = new RecordAuditEventHandler(mockRepository, mockProcessedStore, redactionService);
  });

  describe('handle', () => {
    it('should create and persist an audit record for a new event', async () => {
      mockProcessedStore.isProcessed.mockResolvedValue(false);
      mockRepository.save.mockResolvedValue(undefined);
      mockProcessedStore.markProcessed.mockResolvedValue(undefined);

      await handler.handle(validEvent);

      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      const savedRecord = mockRepository.save.mock.calls[0][0];

      expect(savedRecord.eventId).toBe('evt-abc-123');
      expect(savedRecord.eventType).toBe('PayrollJobCreated');
      expect(savedRecord.companyId).toBe('comp-1');
      expect(savedRecord.correlationId).toBe('corr-xyz');
      expect(savedRecord.payloadSummary).toEqual({
        jobId: 'job-001',
        period: '2026-01',
        ssn: '[REDACTED]',
      });
      expect(savedRecord.occurredAt).toEqual(new Date('2026-07-01T10:00:00Z'));
      expect(mockProcessedStore.markProcessed).toHaveBeenCalledWith('evt-abc-123');
    });

    it('should skip processing when the event was already processed (idempotent)', async () => {
      mockProcessedStore.isProcessed.mockResolvedValue(true);

      await handler.handle(validEvent);

      expect(mockRepository.save).not.toHaveBeenCalled();
      expect(mockProcessedStore.markProcessed).not.toHaveBeenCalled();
    });

    it('should redact sensitive fields from the payload before persisting', async () => {
      mockProcessedStore.isProcessed.mockResolvedValue(false);
      mockRepository.save.mockResolvedValue(undefined);

      await handler.handle({
        ...validEvent,
        payload: {
          employeeId: 'emp-1',
          password: 'supersecret',
          bankAccount: '1234567890',
          name: 'John Doe',
        },
      });

      const savedRecord = mockRepository.save.mock.calls[0][0];
      expect(savedRecord.payloadSummary).toEqual({
        employeeId: 'emp-1',
        password: '[REDACTED]',
        bankAccount: '[REDACTED]',
        name: 'John Doe',
      });
    });

    it('should generate a UUID for the audit record id', async () => {
      mockProcessedStore.isProcessed.mockResolvedValue(false);
      mockRepository.save.mockResolvedValue(undefined);

      await handler.handle(validEvent);

      const savedRecord = mockRepository.save.mock.calls[0][0];
      expect(savedRecord.id).toBeDefined();
      expect(typeof savedRecord.id).toBe('string');
      expect(savedRecord.id.length).toBeGreaterThan(0);
    });

    it('should check idempotency before processing', async () => {
      mockProcessedStore.isProcessed.mockResolvedValue(false);
      mockRepository.save.mockResolvedValue(undefined);

      await handler.handle(validEvent);

      expect(mockProcessedStore.isProcessed).toHaveBeenCalledWith('evt-abc-123');
      expect(mockProcessedStore.isProcessed).toHaveBeenCalledTimes(1);
    });
  });
});
