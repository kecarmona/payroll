import { NotificationRequest } from './notification-request';
import { NotificationStatus } from './notification-status';
import { NotificationType } from './notification-type';

describe('NotificationRequest', () => {
  describe('creation', () => {
    it('should create a new notification request with PENDING status', () => {
      const request = NotificationRequest.create(
        'notif-001',
        'evt-001',
        NotificationType.EMAIL,
        'recipient-001',
        'company-001',
      );

      expect(request.id).toBe('notif-001');
      expect(request.eventId).toBe('evt-001');
      expect(request.type).toBe(NotificationType.EMAIL);
      expect(request.recipientId).toBe('recipient-001');
      expect(request.status).toBe(NotificationStatus.PENDING);
      expect(request.companyId).toBe('company-001');
      expect(request.createdAt).toBeInstanceOf(Date);
      expect(request.version).toBe(0);
    });

    it('should record a NotificationRequested domain event on creation', () => {
      const request = NotificationRequest.create(
        'notif-002',
        'evt-002',
        NotificationType.EMAIL,
        'recipient-002',
        'company-001',
      );

      const events = request.pullEvents();
      expect(events).toHaveLength(2);

      expect(events[0].eventType).toBe('NotificationRequested');
      expect(events[0].aggregateId).toBe('notif-002');
      expect(events[0].payload).toMatchObject({
        notificationId: 'notif-002',
        recipientId: 'recipient-002',
        type: 'EMAIL',
      });

      expect(events[1].eventType).toBe('EmailNotificationRequested');
      expect(events[1].aggregateId).toBe('notif-002');
      expect(events[1].payload).toMatchObject({
        notificationId: 'notif-002',
        recipientId: 'recipient-002',
        type: 'EMAIL',
      });
    });
  });

  describe('status transitions', () => {
    it('should mark as sent', () => {
      const request = NotificationRequest.create(
        'notif-003',
        'evt-003',
        NotificationType.EMAIL,
        'recipient-003',
        'company-001',
      );

      // Clear creation events for clean assertion
      request.clearEvents();

      request.markSent();
      expect(request.status).toBe(NotificationStatus.SENT);
    });

    it('should mark as failed', () => {
      const request = NotificationRequest.create(
        'notif-004',
        'evt-004',
        NotificationType.EMAIL,
        'recipient-004',
        'company-001',
      );

      request.clearEvents();
      request.markFailed();
      expect(request.status).toBe(NotificationStatus.FAILED);
    });
  });

  describe('reconstitution', () => {
    it('should reconstitute from persistence data', () => {
      const createdAt = new Date('2026-07-15T10:00:00Z');
      const request = NotificationRequest.reconstitute(
        'notif-005',
        'evt-005',
        NotificationType.EMAIL,
        'recipient-005',
        NotificationStatus.SENT,
        'company-001',
        createdAt,
        2,
      );

      expect(request.id).toBe('notif-005');
      expect(request.eventId).toBe('evt-005');
      expect(request.type).toBe(NotificationType.EMAIL);
      expect(request.recipientId).toBe('recipient-005');
      expect(request.status).toBe(NotificationStatus.SENT);
      expect(request.companyId).toBe('company-001');
      expect(request.createdAt).toBe(createdAt);
      expect(request.version).toBe(2);
      expect(request.pullEvents()).toEqual([]);
    });
  });
});
