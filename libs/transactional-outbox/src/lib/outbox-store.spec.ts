import { OutboxStore } from './outbox-store';

describe('OutboxStore', () => {
  it('should be definable as an interface contract', () => {
    const mockStore: OutboxStore = {
      save: jest.fn(),
    };

    expect(mockStore).toBeDefined();
    expect(typeof mockStore.save).toBe('function');
  });

  it('should accept a valid outbox event structure via save', async () => {
    const mockStore: OutboxStore = {
      save: jest.fn().mockResolvedValue(undefined),
    };

    await mockStore.save({
      id: 'evt-001',
      eventType: 'PayrollJobCreated',
      aggregateId: 'job-456',
      payload: { jobId: 'job-456', companyId: 'comp-1' },
    });

    expect(mockStore.save).toHaveBeenCalledTimes(1);
    expect(mockStore.save).toHaveBeenCalledWith({
      id: 'evt-001',
      eventType: 'PayrollJobCreated',
      aggregateId: 'job-456',
      payload: { jobId: 'job-456', companyId: 'comp-1' },
    });
  });

  it('should allow different event types and payload shapes', async () => {
    const mockStore: OutboxStore = {
      save: jest.fn().mockResolvedValue(undefined),
    };

    await mockStore.save({
      id: 'evt-002',
      eventType: 'PayrollPeriodCreated',
      aggregateId: 'period-789',
      payload: { periodId: 'period-789', month: 7, year: 2026 },
    });

    expect(mockStore.save).toHaveBeenCalledWith({
      id: 'evt-002',
      eventType: 'PayrollPeriodCreated',
      aggregateId: 'period-789',
      payload: { periodId: 'period-789', month: 7, year: 2026 },
    });
  });
});
