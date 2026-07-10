# Technical Design Document

# Chapter 9

# Deployment

Project

Distributed Payroll Processing Engine

---

# Purpose

This document defines local deployment expectations and future production deployment direction.

---

# Local Deployment

The complete local environment must start with:

```bash
docker compose up
```

Local infrastructure includes:

- PostgreSQL
- MongoDB
- Redis
- Kafka
- Required Kafka UI or admin tooling when useful

---

# Application Services

Expected services:

- auth-service
- employee-service
- payroll-service
- payroll-processing-service
- payroll-projection-service
- notification-service
- email-service
- audit-service

Each service must be runnable independently.

---

# Configuration

Configuration is provided through environment variables.

Required categories:

- HTTP port.
- Database connection string.
- Kafka brokers.
- Redis connection string.
- JWT configuration.
- Logging level.

Secrets must not be committed.

---

# Docker Images

Each deployable service should have its own image.

Image rules:

- Build from reproducible Dockerfile.
- Run as non-root user where possible.
- Expose only required ports.
- Keep runtime image minimal.

---

# Startup Order

Services must tolerate infrastructure startup delays.

Applications should retry connections to:

- PostgreSQL
- MongoDB
- Redis
- Kafka

Startup order must not be the only reliability mechanism.

---

# Health Checks

Each service exposes:

- Liveness endpoint.
- Readiness endpoint.

Readiness verifies required dependencies.

Liveness verifies the process is not stuck.

---

# Migrations

Database migrations run before application startup or as a controlled release step.

Migration failures must stop deployment.

---

# Future Production Direction

Future production deployment may use Kubernetes.

Expected production primitives:

- Deployment per service.
- Horizontal Pod Autoscaler for consumers.
- Secret manager.
- Centralized logs.
- Metrics and tracing.
- Managed PostgreSQL, Kafka, Redis and MongoDB where appropriate.

