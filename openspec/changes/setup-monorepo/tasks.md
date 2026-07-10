# Tasks: Setup Monorepo

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 80–120 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr-default |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Git init + CI + OpenSpec baseline | Single PR | All three are sequential, well under 400 lines |

## Phase 1: Git Init

- [x] 1.1 Verify `.gitignore` covers: `node_modules/`, `dist/`, `coverage/`, `.env`, `docker-data/`, `tmp/`, `logs/`, `.DS_Store`
- [x] 1.2 Run `git init` at project root, stage all scaffold files, commit: `chore: initialize monorepo scaffold`
- [x] 1.3 Verify clean tree: `git status` clean, `git log --oneline` shows commits, no ignored files in `git ls-files`

## Phase 2: CI Skeleton

- [x] 2.1 Create `.github/workflows/ci.yml` — trigger on push to main/develop + all PRs
- [x] 2.2 Define `build` job: checkout → `npx pnpm@9.15.4 install --frozen-lockfile` → `pnpm build` → `pnpm lint` → `pnpm test`
- [x] 2.3 Gate integration tests behind `services:` (PostgreSQL + Kafka) with `if:` conditional; document RAM limitation in YAML comment
- [x] 2.4 Validate workflow structurally (YAML parse check)

## Phase 3: OpenSpec Baseline + Roadmap

- [x] 3.1 Validate `openspec/config.yaml` — entries match 8 services, 4 libs, persistence: hybrid
- [x] 3.2 Mark Phase 0 task 64 `[x]` in `docs/09-tracking/implementation-roadmap.md` (Git init)
- [x] 3.3 Mark Phase 0 tasks 70–72 `[x]` in roadmap (CI, OpenSpec folder, OpenSpec baseline)

## Phase 4: Verification

- [x] 4.1 Run full CI pass: `npx pnpm@9.15.4 install` → `pnpm build` → `pnpm lint` → `pnpm test` (all pass)
- [x] 4.2 Verify `git ls-files` excludes `node_modules/`, `dist/`, `.env`
- [x] 4.3 Verify initial commit SHA is recorded for rollback reference (SHA: 07322f3)
