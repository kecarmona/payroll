import { EmailSender } from './email-sender';

describe('EmailSender', () => {
  it('should be definable as an interface contract', () => {
    const mockSender: EmailSender = {
      send: jest.fn(),
    };

    expect(mockSender).toBeDefined();
    expect(typeof mockSender.send).toBe('function');
  });

  it('should accept to, subject, and body parameters', async () => {
    const mockSender: EmailSender = {
      send: jest.fn().mockResolvedValue(undefined),
    };

    await mockSender.send('user@example.com', 'Test Subject', 'Hello world');
    expect(mockSender.send).toHaveBeenCalledWith(
      'user@example.com',
      'Test Subject',
      'Hello world',
    );
  });

  it('should support sending to different recipients', async () => {
    const mockSender: EmailSender = {
      send: jest.fn().mockResolvedValue(undefined),
    };

    await mockSender.send('admin@example.com', 'Alert', 'System is down');
    expect(mockSender.send).toHaveBeenCalledWith(
      'admin@example.com',
      'Alert',
      'System is down',
    );
  });
});
