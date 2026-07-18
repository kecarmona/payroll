import { EmailDelivery } from './email-delivery';
import { EmailStatus } from './email-status';

describe('EmailDelivery', () => {
  describe('creation', () => {
    it('should create a new email delivery with PENDING status', () => {
      const delivery = EmailDelivery.create(
        'delivery-001',
        'user@example.com',
        'Your Payslip is Ready',
        'Dear user, your payslip is available.',
        'company-001',
      );

      expect(delivery.id).toBe('delivery-001');
      expect(delivery.to).toBe('user@example.com');
      expect(delivery.subject).toBe('Your Payslip is Ready');
      expect(delivery.body).toBe('Dear user, your payslip is available.');
      expect(delivery.status).toBe(EmailStatus.PENDING);
      expect(delivery.companyId).toBe('company-001');
      expect(delivery.retryCount).toBe(0);
      expect(delivery.createdAt).toBeInstanceOf(Date);
      expect(delivery.version).toBe(0);
    });
  });

  describe('status transitions', () => {
    it('should mark as sent', () => {
      const delivery = EmailDelivery.create(
        'delivery-002',
        'user@example.com',
        'Subject',
        'Body',
        'company-001',
      );

      delivery.markSent();
      expect(delivery.status).toBe(EmailStatus.SENT);
    });

    it('should mark as failed', () => {
      const delivery = EmailDelivery.create(
        'delivery-003',
        'user@example.com',
        'Subject',
        'Body',
        'company-001',
      );

      delivery.markFailed();
      expect(delivery.status).toBe(EmailStatus.FAILED);
    });

    it('should increment retry count when marked as failed', () => {
      const delivery = EmailDelivery.create(
        'delivery-004',
        'user@example.com',
        'Subject',
        'Body',
        'company-001',
      );

      expect(delivery.retryCount).toBe(0);
      delivery.markFailed();
      expect(delivery.retryCount).toBe(1);

      delivery.markFailed();
      expect(delivery.retryCount).toBe(2);
    });
  });

  describe('reconstitution', () => {
    it('should reconstitute from persistence data', () => {
      const createdAt = new Date('2026-07-15T10:00:00Z');
      const delivery = EmailDelivery.reconstitute(
        'delivery-005',
        'user@example.com',
        'Subject',
        'Body',
        EmailStatus.SENT,
        'company-001',
        createdAt,
        3,
        2,
      );

      expect(delivery.id).toBe('delivery-005');
      expect(delivery.to).toBe('user@example.com');
      expect(delivery.subject).toBe('Subject');
      expect(delivery.body).toBe('Body');
      expect(delivery.status).toBe(EmailStatus.SENT);
      expect(delivery.companyId).toBe('company-001');
      expect(delivery.createdAt).toBe(createdAt);
      expect(delivery.version).toBe(3);
      expect(delivery.retryCount).toBe(2);
    });
  });
});
