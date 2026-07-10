# Proposal: Setup Monorepo

## Intent

Complete Phase 0 repository readiness so the project can be versioned, CI-capable, and fully bootstrapped for SDD-driven development. Nx workspace, Docker Compose, TypeScript, ESLint, Prettier, and Jest are already configured — this change covers the three remaining gaps: Git init, CI plan, and OpenSpec baseline finalization.

## Scope

### In Scope
- Initialize Git repository with initial commit (all existing scaffold code)
- Add CI placeholder (GitHub Actions workflow skeleton) or document future CI strategy
- Finalize OpenSpec project baseline (validate `openspec/` structure, confirm config)
- Mark Phase 0 tasks complete in `docs/09-tracking/implementation-roadmap.md`

### Out of Scope
- Docker Compose or local infrastructure (already done — covered by `setup-local-infrastructure`)
- Nx workspace, TypeScript, ESLint, Prettier, or test runner configuration (all complete)
- Service implementation or any feature code (future SDD changes)

## Capabilities

> Pure operational setup — no spec-level behavior changes.

### New Capabilities
None

### Modified Capabilities
None

## Approach

1. **Git init**: `git init`, verify `.gitignore` covers `dist/`, `node_modules/`, `.env`, `coverage/`, `docker-data/`; stage all files; initial commit with `chore: initialize monorepo scaffold`
2. **CI placeholder**: Create `.github/workflows/ci.yml` with build → lint → test pipeline. Kafka-dependent jobs gated behind service containers. Document runner requirements
3. **OpenSpec baseline**: Confirm `openspec/config.yaml` matches project state, ensure `openspec/changes/` readiness, validate `.atl/skill-registry.md`
4. **Roadmap update**: Mark Phase 0 tasks 64, 70-72 as done

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `.git/` | New | Git repository initialized |
| `.github/workflows/ci.yml` | New | CI pipeline skeleton |
| `docs/09-tracking/implementation-roadmap.md` | Modified | Phase 0 tasks 64, 70-72 done |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Large initial commit | Low | `.gitignore` already excludes build/test artifacts |
| CI needs Kafka — not on free runners | Medium | Gate Kafka jobs behind `services:` or skip in skeleton; document tradeoff |
| OpenSpec spec dir missing | Low | Create `openspec/specs/` as part of baseline |

## Rollback Plan

- Git: `rm -rf .git && git init` (reversible — no pushes made)
- CI file: `git rm .github/workflows/ci.yml` + revert roadmap
- OpenSpec: Revert any config changes in `openspec/config.yaml`

## Dependencies

- Git CLI (`git --version`)
- GitHub account for CI (documented regardless — CI file is placeholder)

## Success Criteria

- [ ] `git log --oneline` shows a single initial commit with all scaffold files
- [ ] Fresh clone → `pnpm install` → `pnpm build` → `pnpm lint` → `pnpm test` all pass
- [ ] CI workflow file present (or CI plan documented with tradeoffs explained)
- [ ] `openspec/` structure validated: config, changes dir, skill registry all confirmed
- [ ] Roadmap marks Phase 0 tasks 64, 70-72 as complete
