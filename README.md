# Distributed Payroll Processing Engine

Process once. Scale infinitely. Audit everything.

This repository contains a distributed payroll processing platform built with NestJS, Kafka, PostgreSQL, MongoDB and Redis.

The project follows Specification Driven Development and TDD. Start with the documentation before implementing features.

## Documentation

- `project_context.md`
- `docs/README.md`
- `docs/09-tracking/implementation-roadmap.md`

## Local Infrastructure

```bash
docker compose up
```

## Planned Monorepo Commands

```bash
corepack enable
pnpm install
pnpm build
pnpm test
pnpm lint
```

Git initialization is intentionally deferred until requested.
