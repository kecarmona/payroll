import { ProcessedEventStore } from './processed-event-store';

describe('ProcessedEventStore', () => {
  it('should be definable as an interface contract', () => {
    const mockStore: ProcessedEventStore = {
      exists: jest.fn(),
      markProcessed: jest.fn(),
    };

    expect(mockStore).toBeDefined();
    expect(typeof mockStore.exists).toBe('function');
    expect(typeof mockStore.markProcessed).toBe('function');
  });

  it('should allow checking if an event was already processed', async () => {
    const mockStore: ProcessedEventStore = {
      exists: jest.fn().mockResolvedValue(true),
      markProcessed: jest.fn(),
    };

    const result = await mockStore.exists('evt-001');
    expect(result).toBe(true);
    expect(mockStore.exists).toHaveBeenCalledWith('evt-001');
  });

  it('should return false when an event has not been processed', async () => {
    const mockStore: ProcessedEventStore = {
      exists: jest.fn().mockResolvedValue(false),
      markProcessed: jest.fn(),
    };

    const result = await mockStore.exists('evt-999');
    expect(result).toBe(false);
  });

  it('should allow marking an event as processed', async () => {
    const mockStore: ProcessedEventStore = {
      exists: jest.fn(),
      markProcessed: jest.fn().mockResolvedValue(undefined),
    };

    await mockStore.markProcessed('evt-001', 'notif-001');
    expect(mockStore.markProcessed).toHaveBeenCalledWith('evt-001', 'notif-001');
  });
});
