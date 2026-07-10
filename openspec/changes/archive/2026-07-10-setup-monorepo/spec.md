# Setup: Monorepo — Specification

## Purpose

Complete Phase 0 repository readiness: initialize Git, add CI skeleton, validate OpenSpec baseline, and update the implementation roadmap.

## Requirements

### R1 — Initialize Git Repository

The project MUST be tracked by Git with a single initial commit containing all scaffold files.

#### Scenario: Clean git init
- GIVEN no `.git` directory at project root
- WHEN `git init` is executed and all files staged
- THEN `git log --oneline` SHALL show one commit
- AND `git status` SHALL show a clean working tree
- AND `pnpm install` → `pnpm build` → `pnpm lint` → `pnpm test` SHALL pass on a fresh clone

#### Scenario: .gitignore coverage
- GIVEN the existing `.gitignore`
- WHEN checked against project artifacts
- THEN entries MUST cover: `node_modules/`, `dist/`, `coverage/`, `.env`, `docker-data/`, `tmp/`, `logs/`, `.DS_Store`
- AND `dist/`, `node_modules/`, `.env` MUST NOT appear in `git ls-files`

### R2 — CI Pipeline Skeleton

A CI workflow MUST exist at `.github/workflows/ci.yml` with build → lint → test stages.

#### Scenario: Valid workflow
- GIVEN the project root
- WHEN checking `.github/workflows/ci.yml`
- THEN the file SHALL exist and parse as valid GitHub Actions YAML
- AND SHALL define a `build` job running `pnpm install`, `pnpm build`, `pnpm lint`, `pnpm test`

#### Scenario: Kafka dependency tradeoff documented
- GIVEN integration tests require Kafka/PostgreSQL
- WHEN the CI workflow defines service-dependent jobs
- THEN those jobs SHALL use `services:` containers or be explicitly gated/disabled
- AND the file SHALL document the runner requirement

### R3 — OpenSpec Baseline Validated

The `openspec/` directory MUST be structurally complete and consistent.

#### Scenario: Config matches project
- GIVEN `openspec/config.yaml`
- WHEN validated against actual `apps/` and `libs/` state
- THEN all service and lib entries SHALL match existing Nx projects
- AND persistence mode SHALL be `hybrid`

#### Scenario: Changes directory ready
- GIVEN `openspec/changes/` exists
- THEN a `setup-monorepo` subdirectory SHALL exist with `proposal.md` and this `spec.md`
- AND the directory SHALL be writable for future SDD changes

### R4 — Roadmap Updated

Phase 0 completion MUST be reflected in the roadmap.

#### Scenario: Tasks marked done
- GIVEN `docs/09-tracking/implementation-roadmap.md`
- WHEN Phase 0 tasks 64, 70, 71, 72 are fulfilled
- THEN each SHALL be marked `[x]` in the task list
