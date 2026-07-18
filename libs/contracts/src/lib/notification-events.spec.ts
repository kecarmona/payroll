import { NotificationEventType } from './notification-events';

describe('NotificationEventType', () => {
  it('should define NotificationRequested constant', () => {
    expect(NotificationEventType.NotificationRequested).toBe('NotificationRequested');
  });

  it('should define EmailNotificationRequested constant', () => {
    expect(NotificationEventType.EmailNotificationRequested).toBe('EmailNotificationRequested');
  });

  it('should define EmailSent constant', () => {
    expect(NotificationEventType.EmailSent).toBe('EmailSent');
  });

  it('should define EmailFailed constant', () => {
    expect(NotificationEventType.EmailFailed).toBe('EmailFailed');
  });

  it('should have exactly 4 entries', () => {
    const entries = Object.keys(NotificationEventType);
    expect(entries).toHaveLength(4);
  });

  it('should have all values matching their keys', () => {
    for (const [key, value] of Object.entries(NotificationEventType)) {
      expect(key).toBe(value);
    }
  });
});
