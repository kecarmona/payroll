import { EmailStatus } from './email-status';

describe('EmailStatus', () => {
  it('should define PENDING constant', () => {
    expect(EmailStatus.PENDING).toBe('PENDING');
  });

  it('should define SENT constant', () => {
    expect(EmailStatus.SENT).toBe('SENT');
  });

  it('should define FAILED constant', () => {
    expect(EmailStatus.FAILED).toBe('FAILED');
  });

  it('should have exactly 3 entries', () => {
    const entries = Object.keys(EmailStatus);
    expect(entries).toHaveLength(3);
  });

  it('should have all values matching their keys', () => {
    for (const [key, value] of Object.entries(EmailStatus)) {
      expect(key).toBe(value);
    }
  });
});
