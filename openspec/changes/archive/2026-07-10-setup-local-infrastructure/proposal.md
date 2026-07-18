# Proposal: setup-local-infrastructure

## Intent

Complete Phase 1 infrastructure by adding the missing `lint` target to all 12 project.json files. The ESLint flat config (`eslint.config.mjs`) and `@nx/eslint` dependency already exist, but `nx run-many -t lint` will fail because no project has a lint executor configured.

## Scope

### In Scope
- Add `@nx/eslint:lint` executor target to all 12 project.json files
- Verify `pnpm lint` runs ESLint and passes on current code
- Update Phase 1 roadmap task statuses

### Out of Scope
- Adding new ESLint rules or changing the config
- Fixing any lint violations (none exist in current code)
- Adding lint targets to any future project.json

## Capabilities

### New Capabilities
None — pure tooling/infrastructure change, no spec-level behavior.

### Modified Capabilities
None — no existing specs to modify.

## Approach

1. Add `lint` target block to each of the 12 project.json files using `@nx/eslint:lint` executor with `lintFilePatterns` pointing to the project's source root.
2. Run `pnpm lint` (`nx run-many -t lint`) to confirm all pass.
3. Update `docs/09-tracking/implementation-roadmap.md`: mark Task 105 done.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `apps/*/project.json` (8 files) | Modified | Add `lint` target |
| `libs/*/project.json` (4 files) | Modified | Add `lint` target |
| `docs/09-tracking/implementation-roadmap.md` | Modified | Mark Task 105 done |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `@nx/eslint:lint` executor not registered in nx.json | Low | Already in `targetDefaults` |
| Missing lintFilePatterns syntax | Low | Nx 19.8 docs confirm `lintFilePatterns: ["{projectRoot}/**/*.ts"]` pattern |
| Pre-existing lint violations surface | Low | Current code is scaffold-level — no violations expected |

## Rollback Plan

Revert the 12 project.json files using `git checkout HEAD -- <files>` or drop the `setup-local-infrastructure` branch.

## Dependencies

- `@nx/eslint@19.8.4` — already in `devDependencies`
- `@nx/eslint-plugin@^19.8.4` — already in `devDependencies`

## Success Criteria

- [ ] `pnpm lint` runs ESLint on all 12 projects and exits 0
- [ ] All 12 project.json files have a `lint` target
- [ ] Roadmap task 105 (ESLint) marked complete
