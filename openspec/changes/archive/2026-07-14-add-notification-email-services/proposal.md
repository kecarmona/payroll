# Proposal: Add Notification and Email Services

## Intent

Create two services that handle notification routing and email delivery, triggered by PayslipGenerated events.

## Scope

1. **`notification-service`** — consumes PayslipGenerated, creates notification requests, routes to email channel, emits EmailNotificationRequested
2. **`email-service`** — consumes EmailNotificationRequested, implements local/dev email adapter (logs instead of SMTP), emits EmailSent/EmailFailed

## Flow

```
PayslipGenerated
  → Notification Service consumes
    → Creates notification request
    → Decides email channel
    → Emits EmailNotificationRequested via outbox
      → Email Service consumes
        → Logs email (dev adapter)
        → Emits EmailSent or EmailFailed
```

## Non-goals

- Real SMTP integration (dev adapter logs only)
- Email templates (plain text for now)
- Push notifications (SMS, in-app)
- User preferences for notification channels

## Dependencies

- `libs/contracts` — NotificationEventType, event payloads
- `libs/transactional-outbox` — outbox for emitted events
- `libs/service-foundation` — NestJS base modules
- Docker Compose (Kafka)
