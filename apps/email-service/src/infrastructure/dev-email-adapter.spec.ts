import { Logger } from '@nestjs/common';
import { DevEmailAdapter } from './dev-email-adapter';

describe('DevEmailAdapter', () => {
  it('should log the email and resolve successfully', async () => {
    const loggerSpy = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as unknown as Logger;

    const adapter = new DevEmailAdapter(loggerSpy);

    await adapter.send('user@example.com', 'Test Subject', 'Hello');

    expect(loggerSpy.log).toHaveBeenCalledTimes(1);
    expect(loggerSpy.log).toHaveBeenCalledWith(
      '[DevEmailAdapter] Sending email to=user@example.com subject="Test Subject"',
    );
  });

  it('should handle different email content', async () => {
    const loggerSpy = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as unknown as Logger;

    const adapter = new DevEmailAdapter(loggerSpy);

    await adapter.send('admin@company.com', 'Alert', 'Critical error occurred');

    expect(loggerSpy.log).toHaveBeenCalledWith(
      '[DevEmailAdapter] Sending email to=admin@company.com subject="Alert"',
    );
  });

  it('should implement the EmailSender interface', () => {
    const adapter = new DevEmailAdapter({
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as unknown as Logger);
    expect(typeof adapter.send).toBe('function');
  });
});
