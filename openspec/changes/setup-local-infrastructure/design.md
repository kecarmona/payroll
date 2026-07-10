# Design: Setup Local Infrastructure — Add Lint Targets

## Technical Approach

Add the `@nx/eslint:lint` executor target to all 12 `project.json` files so `nx run-many -t lint` resolves the executor for every project. ESLint flat config (`eslint.config.mjs`) and `@nx/eslint` dependency already exist; `nx.json` already has a `lint` target default. The only gap is per-project executor registration.

Per the spec, no behavioral changes — pure tooling wiring.

## Architecture Decisions

### Decision: Executor Selection

| Option | Tradeoff | Decision |
|--------|----------|----------|
| `@nx/eslint:lint` | Standard Nx ESLint executor, matches `targetDefaults.lint` | ✅ **Chosen** |
| Inline eslint script | Bypasses Nx caching, no parallelism | ❌ Rejected |
| `@nx/linter:eslint` | Deprecated since Nx 16 | ❌ Rejected |

**Rationale**: `@nx/eslint:lint` is the current Nx 19.8 executor. It integrates with Nx caching, parallel execution, and the existing `targetDefaults.lint` config.

### Decision: lintFilePatterns — Service vs Library

| Aspect | Service Pattern | Library Pattern |
|--------|----------------|-----------------|
| Source | `apps/{name}/src/**/*.ts` | `libs/{name}/src/**/*.ts` |
| Test | `apps/{name}/test/**/*.ts` | *(omitted — no test dir)* |

**Rationale**: Services have a parallel `test/` directory for integration tests; libraries place tests alongside source files under `src/`. Matching the project's actual directory structure avoids false negatives.

## Data Flow

```
developer runs `pnpm lint`
  → nx run-many -t lint
    → nx.json targetDefaults.lint (inputs: default, ^production)
      → per-project project.json targets.lint
        → @nx/eslint:lint executor
          → eslint.config.mjs (flat config)
            → ESLint results per project
```

No cross-project data flow — each project is linted independently.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `apps/auth-service/project.json` | Modify | Add `lint` target with `@nx/eslint:lint` |
| `apps/employee-service/project.json` | Modify | Same |
| `apps/payroll-service/project.json` | Modify | Same |
| `apps/payroll-processing-service/project.json` | Modify | Same |
| `apps/payroll-projection-service/project.json` | Modify | Same |
| `apps/notification-service/project.json` | Modify | Same |
| `apps/email-service/project.json` | Modify | Same |
| `apps/audit-service/project.json` | Modify | Same |
| `libs/shared-kernel/project.json` | Modify | Add `lint` target with library pattern |
| `libs/contracts/project.json` | Modify | Same |
| `libs/event-bus/project.json` | Modify | Same |
| `libs/testing/project.json` | Modify | Same |
| `docs/09-tracking/implementation-roadmap.md` | Modify | Mark Task 105 (ESLint) done |

### Target Template — Services

```json
"lint": {
  "executor": "@nx/eslint:lint",
  "options": {
    "lintFilePatterns": ["apps/{name}/src/**/*.ts", "apps/{name}/test/**/*.ts"]
  }
}
```

### Target Template — Libraries

```json
"lint": {
  "executor": "@nx/eslint:lint",
  "options": {
    "lintFilePatterns": ["libs/{name}/src/**/*.ts"]
  }
}
```

## Interfaces / Contracts

None — pure tooling change, no API contracts or data structures.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Validation | `pnpm lint` exits 0 | Run `nx run-many -t lint` after all targets added |
| Smoke | Each project resolves lint target | `nx lint {project}` for one service and one library |

No unit, integration, or E2E tests needed — this is build-tool configuration, not application logic.

## Migration / Rollout

No migration required. Targets are additive; removing a target is a revert. Run `pnpm lint` immediately after changes to confirm all 12 projects pass.

## Open Questions

None.
