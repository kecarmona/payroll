# Spec: Add Notification and Email Services

## 1. Notification Service

### Kafka Consumer
- Consumes from `notification.events` topic
- Routes PayslipGenerated to notification handler

### Flow
1. Receives PayslipGenerated
2. Checks idempotency (processed-event store)
3. Creates notification request record
4. Routes to email channel → emits EmailNotificationRequested via outbox
5. Emits NotificationRequested via outbox

### Domain
- NotificationRequest aggregate: id, eventId, type (EMAIL), recipientId, status (PENDING, SENT, FAILED), createdAt

## 2. Email Service

### Kafka Consumer
- Consumes from `notification.events` topic
- Routes EmailNotificationRequested to email handler

### Email Adapter
- Dev adapter: logs email content (to, subject, body) via logger
- Interface allows swapping for real SMTP adapter later

### Domain
- EmailDelivery aggregate: id, to, subject, body, status (PENDING, SENT, FAILED), retryCount, createdAt

## Acceptance Criteria

1. PayslipGenerated → notification request created → EmailNotificationRequested emitted
2. EmailNotificationRequested → email logged → EmailSent emitted
3. Email failures → EmailFailed emitted
4. Duplicate events → no-op (idempotent)
5. All events go through the outbox
