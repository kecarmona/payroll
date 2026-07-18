import { PayrollPeriod } from './payroll-period.entity';

describe('PayrollPeriod', () => {
  const companyId = 'company-1';

  describe('create', () => {
    it('should create a new payroll period with isClosed=false', () => {
      const period = PayrollPeriod.create(
        companyId,
        1,
        2026,
        '2026-01-01',
        '2026-01-31',
      );

      expect(period.month).toBe(1);
      expect(period.year).toBe(2026);
      expect(period.startDate).toBe('2026-01-01');
      expect(period.endDate).toBe('2026-01-31');
      expect(period.isClosed).toBe(false);
      expect(period.companyId).toBe(companyId);
      expect(period.id).toBeDefined();
    });

    it('should record a PayrollPeriodCreated event', () => {
      const period = PayrollPeriod.create(
        companyId,
        1,
        2026,
        '2026-01-01',
        '2026-01-31',
      );

      const events = period.pullEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('PayrollPeriodCreated');
      expect(events[0].aggregateId).toBe(period.id);
      expect(events[0].companyId).toBe(companyId);
    });

    it('should start with version 0', () => {
      const period = PayrollPeriod.create(
        companyId,
        1,
        2026,
        '2026-01-01',
        '2026-01-31',
      );
      expect(period.version).toBe(0);
    });
  });

  describe('reconstitute', () => {
    it('should recreate a PayrollPeriod from persisted data without events', () => {
      const period = PayrollPeriod.reconstitute({
        id: 'pp-123',
        companyId,
        month: 2,
        year: 2026,
        startDate: '2026-02-01',
        endDate: '2026-02-28',
        isClosed: true,
        version: 5,
      });

      expect(period.id).toBe('pp-123');
      expect(period.month).toBe(2);
      expect(period.year).toBe(2026);
      expect(period.startDate).toBe('2026-02-01');
      expect(period.endDate).toBe('2026-02-28');
      expect(period.isClosed).toBe(true);
      expect(period.version).toBe(5);

      const events = period.pullEvents();
      expect(events).toHaveLength(0);
    });
  });

  describe('close', () => {
    it('should close an open period', () => {
      const period = PayrollPeriod.create(
        companyId,
        1,
        2026,
        '2026-01-01',
        '2026-01-31',
      );
      period.pullEvents(); // clear creation event

      period.close();
      expect(period.isClosed).toBe(true);
    });

    it('should be idempotent when closing an already closed period', () => {
      const period = PayrollPeriod.create(
        companyId,
        3,
        2026,
        '2026-03-01',
        '2026-03-31',
      );
      period.pullEvents();
      period.close();
      period.pullEvents();

      period.close();
      expect(period.isClosed).toBe(true);
    });
  });
});
