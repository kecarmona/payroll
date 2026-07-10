# ADR 0001: Use Nx Monorepo

Status

Accepted

---

# Context

The platform contains multiple NestJS services and shared libraries.

The project needs consistent build, test and dependency boundaries while preserving service independence.

---

# Decision

Use Nx as the monorepo tool.

The repository will contain:

- apps for deployable services.
- libs for shared kernel, contracts, event bus and testing utilities.

---

# Consequences

Positive:

- Consistent tooling across services.
- Easier affected builds and tests.
- Explicit dependency graph.
- Better local developer experience.

Tradeoffs:

- Nx introduces monorepo conventions.
- Teams must avoid coupling services through shared implementation libraries.

---

# Rules

- Shared domain primitives belong in shared-kernel.
- Event and API contracts belong in contracts.
- Service-specific domain logic must stay inside the owning app or service library.

