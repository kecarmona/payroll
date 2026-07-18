import { PayrollEventType } from '@payroll/contracts';
import { PayrollJob } from './payroll-job.entity';
import { PayrollJobStatus } from './payroll-job-status';
import { InvalidStatusTransitionError } from './errors';

describe('PayrollJob', () => {
  const companyId = 'company-1';
  const periodId = 'pp-123';

  describe('create', () => {
    it('should create a new payroll job in CREATED status', () => {
      const job = PayrollJob.create(companyId, periodId);

      expect(job.companyId).toBe(companyId);
      expect(job.periodId).toBe(periodId);
      expect(job.status.value).toBe('CREATED');
      expect(job.id).toBeDefined();
    });

    it('should record a PayrollJobCreated event', () => {
      const job = PayrollJob.create(companyId, periodId);

      const events = job.pullEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe(PayrollEventType.PayrollJobCreated);
      expect(events[0].aggregateId).toBe(job.id);
      expect(events[0].companyId).toBe(companyId);
      expect((events[0].payload as Record<string, string>).periodId).toBe(periodId);
    });

    it('should start with version 0', () => {
      const job = PayrollJob.create(companyId, periodId);
      expect(job.version).toBe(0);
    });
  });

  describe('reconstitute', () => {
    it('should recreate a PayrollJob from persisted data without events', () => {
      const job = PayrollJob.reconstitute({
        id: 'pj-123',
        companyId,
        periodId: 'pp-456',
        status: PayrollJobStatus.PROCESSING,
        version: 3,
      });

      expect(job.id).toBe('pj-123');
      expect(job.companyId).toBe(companyId);
      expect(job.periodId).toBe('pp-456');
      expect(job.status.value).toBe('PROCESSING');
      expect(job.version).toBe(3);

      const events = job.pullEvents();
      expect(events).toHaveLength(0);
    });
  });

  describe('transitionTo', () => {
    it('should transition from CREATED to PROCESSING', () => {
      const job = PayrollJob.create(companyId, periodId);
      job.pullEvents(); // clear creation event

      job.transitionTo(PayrollJobStatus.PROCESSING);

      expect(job.status.value).toBe('PROCESSING');
    });

    it('should transition from PROCESSING to COMPLETED', () => {
      const job = PayrollJob.create(companyId, periodId);
      job.pullEvents();
      job.transitionTo(PayrollJobStatus.PROCESSING);
      job.pullEvents();

      job.transitionTo(PayrollJobStatus.COMPLETED);

      expect(job.status.value).toBe('COMPLETED');
    });

    it('should transition from PROCESSING to FAILED', () => {
      const job = PayrollJob.create(companyId, periodId);
      job.pullEvents();
      job.transitionTo(PayrollJobStatus.PROCESSING);
      job.pullEvents();

      job.transitionTo(PayrollJobStatus.FAILED);

      expect(job.status.value).toBe('FAILED');
    });

    it('should throw InvalidStatusTransitionError when transitioning from CREATED to COMPLETED', () => {
      const job = PayrollJob.create(companyId, periodId);
      job.pullEvents();

      expect(() => {
        job.transitionTo(PayrollJobStatus.COMPLETED);
      }).toThrow(InvalidStatusTransitionError);
    });

    it('should throw InvalidStatusTransitionError when transitioning from COMPLETED to any status', () => {
      const job = PayrollJob.create(companyId, periodId);
      job.pullEvents();
      job.transitionTo(PayrollJobStatus.PROCESSING);
      job.pullEvents();
      job.transitionTo(PayrollJobStatus.COMPLETED);
      job.pullEvents();

      expect(() => {
        job.transitionTo(PayrollJobStatus.FAILED);
      }).toThrow(InvalidStatusTransitionError);
    });
  });
});
