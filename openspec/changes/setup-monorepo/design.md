# Design: Setup Monorepo

## Technical Approach

Pure operational setup — no domain logic, no code changes. Three sequential deliverables:

1. **Git init** — Initialize repo with all scaffold files as a single clean `chore:` commit
2. **CI skeleton** — GitHub Actions workflow: install → build → lint → test, with Kafka-dependent jobs gated
3. **OpenSpec baseline + roadmap** — Validate `openspec/` structure, mark Phase 0 tasks done

Each step is independent with its own rollback path.

## Architecture Decisions

### Decision: Single initial commit

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Single `chore:` commit | Clean baseline, no noise | **Chosen** |
| Per-service staged commits | More audit granularity, zero value at scaffold stage | Rejected |
| Interactive rebase history | Over-engineered for first commit | Rejected |

### Decision: CI trigger scope

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Push to main/develop + all PRs | Covers review + baseline | **Chosen** |
| PR-only | No guard on direct pushes to main | Rejected |
| All branches on push | Wastes runners on WIP branches | Rejected |

### Decision: Kafka in CI

| Option | Tradeoff | Decision |
|--------|----------|----------|
| `services:` containers on integration job | Standard GH Actions pattern, works on paid runners | **Chosen** |
| Skip Kafka jobs entirely | Gaps in test coverage | Rejected |
| Require self-hosted runner | Imposes infra burden before Phase 1 | Rejected |

**Rationale**: GitHub free runners (7 GB RAM) may OOM Kafka — documented as a known limitation in the workflow comment rather than silently skipped or over-engineered.

## Data Flow

No runtime data flow. Build-time flow:

```
push/PR → checkout → pnpm install --frozen-lockfile → pnpm build → pnpm lint → pnpm test
                                                                               └── unit (no deps)
                                                                               └── integration (services: postgres + kafka)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `.git/` | Create | Repository metadata (via `git init`) |
| `.github/workflows/ci.yml` | Create | CI pipeline definition |
| `docs/09-tracking/implementation-roadmap.md` | Modify | Mark Phase 0 tasks 64, 70-72 as `[x]` |

## Interfaces / Contracts

None — operational setup produces no runtime interfaces. The CI workflow defines these build contracts:

| Step | Command | Expected | Failure |
|------|---------|----------|---------|
| Install | `pnpm install --frozen-lockfile` | Exit 0 | Corrupt lockfile or missing dep |
| Build | `pnpm build` (12/12 projects) | Exit 0 | TypeScript compilation error |
| Lint | `pnpm lint` | Exit 0 | ESLint rule violation |
| Unit test | `pnpm test` (test-filtered) | Exit 0 / pass-zero | Config or infra issue |
| Integration | `pnpm test` on integration projects | Exit 0 (or skipped) | Kafka/PostgreSQL unavailable |

## Testing Strategy

No production code — verification uses build-only gates:

| Layer | What | Approach |
|-------|------|----------|
| Git state | `git log --oneline`, `git status`, `git ls-files` | Verify single commit, clean tree, no ignored files in index |
| Build | `pnpm install && pnpm build && pnpm lint && pnpm test` | Full CI-equivalent pass |
| CI YAML | YAML syntax + `act --dry-run` | Structural validity |
| Idempotency | `git init` on existing repo | Must print "Reinitialized", not fail |

## Migration / Rollout

No migration — this is initial setup.

### Rollback

| Scenario | Action |
|----------|--------|
| Wrong git init | `rm -rf .git` then re-init |
| CI misconfig | `git rm .github/workflows/ci.yml` or revert file |
| Roadmap errors | Revert markers from `[x]` to `[ ]` |
| Full rollback | `rm -rf .git .github/` + `git checkout -- docs/09-tracking/implementation-roadmap.md` |

## Open Questions

None — all decisions bounded by the spec.
