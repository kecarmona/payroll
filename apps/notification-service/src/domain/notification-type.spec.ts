import { NotificationType } from './notification-type';

describe('NotificationType', () => {
  it('should define EMAIL constant', () => {
    expect(NotificationType.EMAIL).toBe('EMAIL');
  });

  it('should have exactly 1 entry', () => {
    const entries = Object.keys(NotificationType);
    expect(entries).toHaveLength(1);
  });

  it('should have all values matching their keys', () => {
    for (const [key, value] of Object.entries(NotificationType)) {
      expect(key).toBe(value);
    }
  });
});
