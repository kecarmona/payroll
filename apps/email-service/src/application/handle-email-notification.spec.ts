import { Logger } from '@nestjs/common';
import { EventEnvelope } from '@payroll/contracts';
import {
  HandleEmailNotification,
  EmailNotificationRequestedPayload,
} from './handle-email-notification';
import type { EmailSender } from '../domain/email-sender';

describe('HandleEmailNotification', () => {
  let emailSender: jest.Mocked<EmailSender>;
  let logger: Logger;
  let handler: HandleEmailNotification;

  const mockEvent: EventEnvelope<EmailNotificationRequestedPayload> = {
    eventId: 'evt-email-notif-001',
    eventType: 'EmailNotificationRequested',
    version: 1,
    timestamp: '2026-07-15T10:00:00Z',
    companyId: 'company-001',
    correlationId: 'corr-001',
    causationId: 'cause-001',
    producer: 'notification-service',
    payload: {
      notificationId: 'notif-001',
      recipientId: 'emp-001',
      type: 'EMAIL',
      companyId: 'company-001',
      eventId: 'evt-payslip-001',
    },
  };

  beforeEach(() => {
    emailSender = {
      send: jest.fn().mockResolvedValue(undefined),
    };
    logger = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as unknown as Logger;
    handler = new HandleEmailNotification(emailSender, logger);
  });

  it('should send an email when handling the notification', async () => {
    await handler.handle(mockEvent);

    expect(emailSender.send).toHaveBeenCalledWith(
      'emp-001',
      expect.stringContaining('Your Payslip is Ready'),
      expect.stringContaining('emp-001'),
    );
  });

  it('should log success when email is sent', async () => {
    await handler.handle(mockEvent);

    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('evt-email-notif-001'),
    );
  });

  it('should log a warning when email sending fails', async () => {
    emailSender.send.mockRejectedValue(new Error('SMTP connection failed'));

    await handler.handle(mockEvent);

    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Failed'),
      expect.any(String),
    );
  });

  it('should not throw when email sending fails', async () => {
    emailSender.send.mockRejectedValue(new Error('SMTP connection failed'));

    await expect(handler.handle(mockEvent)).resolves.toBeUndefined();
  });
});
