# Design: Add Notification and Email Services

## Architecture

```
Kafka (payroll.events)
    │  PayslipGenerated
    ▼
┌──────────────────────┐
│ Notification Service  │
│ (event consumer)      │
│                       │
│  → Create notification│
│  → Emit EmailNotifReq │──► outbox
│  → Emit NotifRequested│──► outbox
└──────────┬───────────┘
           │ EmailNotificationRequested
           ▼ (notification.events topic)
┌──────────────────────┐
│ Email Service         │
│ (event consumer)      │
│                       │
│  → Log email (dev)    │
│  → Emit EmailSent     │──► outbox
│  → Emit EmailFailed   │──► outbox
└──────────────────────┘
