import { NotificationStatus } from './notification-status';

describe('NotificationStatus', () => {
  it('should define PENDING constant', () => {
    expect(NotificationStatus.PENDING).toBe('PENDING');
  });

  it('should define SENT constant', () => {
    expect(NotificationStatus.SENT).toBe('SENT');
  });

  it('should define FAILED constant', () => {
    expect(NotificationStatus.FAILED).toBe('FAILED');
  });

  it('should have exactly 3 entries', () => {
    const entries = Object.keys(NotificationStatus);
    expect(entries).toHaveLength(3);
  });

  it('should have all values matching their keys', () => {
    for (const [key, value] of Object.entries(NotificationStatus)) {
      expect(key).toBe(value);
    }
  });
});
