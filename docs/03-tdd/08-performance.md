# Technical Design Document

# Chapter 8

# Performance

Project

Distributed Payroll Processing Engine

---

# Purpose

This document defines performance expectations, scalability strategy and test targets.

---

# Performance Goals

The platform should demonstrate:

- High-volume payroll job processing.
- Parallel employee transaction execution.
- Efficient event consumption.
- Fast dashboard queries through projections.
- Stable behavior under retry pressure.

---

# Scalability Model

Payroll processing scales horizontally by:

- Increasing Kafka partitions.
- Increasing consumer replicas.
- Processing payroll transactions independently.
- Avoiding large aggregates.
- Keeping read models denormalized.

---

# Throughput Targets

Initial local targets:

- Create payroll job in less than 500 ms.
- Create 1,000 payroll transactions in less than 30 seconds.
- Process 1,000 simple payroll transactions in less than 60 seconds.
- Serve dashboard read model queries in less than 300 ms.

These targets are development baselines and may evolve after measurement.

---

# Bottleneck Risks

Expected bottlenecks:

- Kafka partition count.
- PostgreSQL row locking.
- Outbox polling frequency.
- Payroll calculation complexity.
- MongoDB projection write throughput.
- Redis idempotency hot keys.

---

# Load Testing

Load tests validate expected normal traffic.

Scenarios:

- Concurrent payroll job creation attempts.
- Large payroll job processing.
- Dashboard reads during active processing.
- Notification bursts after payroll completion.

---

# Stress Testing

Stress tests identify breaking points.

Scenarios:

- More employees than expected baseline.
- Higher Kafka consumer lag.
- Increased retry volume.
- Increased concurrent API requests.

---

# Spike Testing

Spike tests validate sudden traffic changes.

Scenarios:

- Many companies start payroll at the same time.
- Large notification burst.
- Dashboard refresh storm after payroll completion.

---

# Soak Testing

Soak tests validate long-running stability.

Scenarios:

- Continuous payroll jobs for multiple hours.
- Periodic consumer restarts.
- Long-running outbox publishing.
- Projection rebuild under steady event flow.

---

# Metrics

Required metrics:

- Payroll job duration.
- Payroll transaction duration.
- Kafka consumer lag.
- Outbox pending count.
- Retry count.
- DLQ count.
- Database query duration.
- API response time.

