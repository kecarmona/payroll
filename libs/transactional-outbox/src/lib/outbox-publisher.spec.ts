import { OutboxPublisher } from './outbox-publisher';

describe('OutboxPublisher', () => {
  it('should be definable as an interface contract', () => {
    const mockPublisher: OutboxPublisher = {
      publishPending: jest.fn(),
    };

    expect(mockPublisher).toBeDefined();
    expect(typeof mockPublisher.publishPending).toBe('function');
  });

  it('should resolve successfully when publishPending completes', async () => {
    const mockPublisher: OutboxPublisher = {
      publishPending: jest.fn().mockResolvedValue(undefined),
    };

    await expect(mockPublisher.publishPending()).resolves.toBeUndefined();
  });

  it('should propagate errors when publishPending fails', async () => {
    const mockPublisher: OutboxPublisher = {
      publishPending: jest.fn().mockRejectedValue(new Error('Kafka unavailable')),
    };

    await expect(mockPublisher.publishPending()).rejects.toThrow('Kafka unavailable');
  });
});
