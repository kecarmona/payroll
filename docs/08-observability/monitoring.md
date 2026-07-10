# Monitoring and Observability Plan

Project

Distributed Payroll Processing Engine

---

# Purpose

Define the first monitoring model for logs, metrics, traces and alerts.

---

# Core Signals

The platform must expose:

- Structured logs.
- Application metrics.
- Distributed traces.
- Business audit records.

---

# Required Dashboards

## Payroll Processing Dashboard

Shows:

- Active payroll jobs.
- Completed payroll jobs.
- Failed payroll jobs.
- Average payroll job duration.
- Payroll transactions per state.
- Payroll transaction failure rate.

---

## Messaging Dashboard

Shows:

- Kafka consumer lag.
- Messages consumed per service.
- Message processing duration.
- Retry count.
- DLQ count.

---

## Outbox Dashboard

Shows:

- Pending outbox records.
- Published outbox records.
- Failed outbox records.
- Average publish delay.
- Publisher error count.

---

## API Dashboard

Shows:

- Request rate.
- Response latency.
- Error rate.
- Unauthorized and forbidden requests.
- Rate-limited requests.

---

# Initial Alerts

Create alerts for:

- Payroll job stuck in PROCESSING.
- DLQ count greater than zero.
- Outbox pending count growing continuously.
- Kafka consumer lag above threshold.
- API 5xx rate above threshold.
- Database connectivity failures.

---

# Log Requirements

Every service log entry should include:

- service
- environment
- level
- message
- correlationId
- companyId
- requestId
- eventId when applicable

---

# Trace Requirements

Trace the following workflows:

- Create payroll job.
- Publish outbox event.
- Consume PayrollJobCreated.
- Process payroll transaction.
- Generate payslip.
- Update projection.
- Send notification.

---

# Audit vs Logs

Application logs explain technical behavior.

Audit records preserve business history.

Audit records must not be replaced by logs.

