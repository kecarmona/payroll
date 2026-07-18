import { NotificationRequestRepository } from './notification-request-repository';

describe('NotificationRequestRepository', () => {
  it('should be definable as an interface contract', () => {
    const mockRepo: NotificationRequestRepository = {
      save: jest.fn(),
    };

    expect(mockRepo).toBeDefined();
    expect(typeof mockRepo.save).toBe('function');
  });

  it('should accept a notification request via save', async () => {
    const mockRepo: NotificationRequestRepository = {
      save: jest.fn().mockResolvedValue(undefined),
    };

    await mockRepo.save({} as unknown as Parameters<NotificationRequestRepository['save']>[0]);
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
  });
});
