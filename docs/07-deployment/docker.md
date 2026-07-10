# Docker Deployment Guide

Project

Distributed Payroll Processing Engine

---

# Purpose

Define the expected local Docker environment for development and testing.

---

# Local Startup

The complete infrastructure should start with:

```bash
docker compose up
```

The command should provide:

- PostgreSQL
- MongoDB
- Redis
- Kafka
- Kafka admin UI when configured

---

# Expected Environment Variables

Common variables:

- NODE_ENV
- LOG_LEVEL
- SERVICE_NAME
- HTTP_PORT

PostgreSQL:

- DATABASE_URL

MongoDB:

- MONGODB_URI

Redis:

- REDIS_URL

Kafka:

- KAFKA_BROKERS
- KAFKA_CLIENT_ID
- KAFKA_CONSUMER_GROUP

Auth:

- JWT_ACCESS_SECRET
- JWT_REFRESH_SECRET
- JWT_ACCESS_TTL
- JWT_REFRESH_TTL

---

# Health Checks

Each service should expose:

- GET /health/live
- GET /health/ready

Readiness must verify required dependencies.

---

# Development Workflow

Recommended flow:

1. Start infrastructure with Docker Compose.
2. Run migrations.
3. Start application services.
4. Run integration tests.
5. Run E2E workflow tests.

---

# Data Volumes

Local Docker volumes may persist infrastructure state.

If a clean environment is required, remove volumes intentionally.

Do not automate destructive volume removal in regular startup scripts.

---

# Troubleshooting

Common checks:

- Kafka broker is reachable from service containers.
- PostgreSQL database exists and migrations ran.
- MongoDB projection collections are writable.
- Redis is reachable before idempotent commands are tested.
- Service ports do not conflict locally.

