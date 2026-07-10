# Local Infrastructure Specification

## Purpose

Define the operational tooling baseline for the monorepo: every Nx project MUST have a `lint` target so `nx run-many -t lint` runs ESLint across all projects uniformly.

## Requirements

### Requirement: Lint Target on Application Projects

All 8 application projects MUST have a `lint` target using the `@nx/eslint:lint` executor with `lintFilePatterns` covering both `src/` and `test/` directories.

| Project | `lintFilePatterns` |
|---------|-------------------|
| auth-service | `apps/auth-service/src/**/*.ts`, `apps/auth-service/test/**/*.ts` |
| employee-service | `apps/employee-service/src/**/*.ts`, `apps/employee-service/test/**/*.ts` |
| payroll-service | `apps/payroll-service/src/**/*.ts`, `apps/payroll-service/test/**/*.ts` |
| payroll-processing-service | `apps/payroll-processing-service/src/**/*.ts`, `apps/payroll-processing-service/test/**/*.ts` |
| payroll-projection-service | `apps/payroll-projection-service/src/**/*.ts`, `apps/payroll-projection-service/test/**/*.ts` |
| notification-service | `apps/notification-service/src/**/*.ts`, `apps/notification-service/test/**/*.ts` |
| email-service | `apps/email-service/src/**/*.ts`, `apps/email-service/test/**/*.ts` |
| audit-service | `apps/audit-service/src/**/*.ts`, `apps/audit-service/test/**/*.ts` |

#### Scenario: All apps get lint target

- GIVEN an application project.json (e.g. `apps/auth-service/project.json`) with `build`, `serve`, and `test` targets
- WHEN the `lint` target is added
- THEN the target MUST use `"executor": "@nx/eslint:lint"`
- AND the target MUST include `"outputs": ["{options.outputFile}"]`
- AND `options.lintFilePatterns` MUST include both the `src/` and `test/` directory globs

### Requirement: Lint Target on Library Projects

All 4 library projects MUST have a `lint` target using the `@nx/eslint:lint` executor with `lintFilePatterns` covering `src/` only (libraries have no test directory at the project root).

| Project | `lintFilePatterns` |
|---------|-------------------|
| shared-kernel | `libs/shared-kernel/src/**/*.ts` |
| contracts | `libs/contracts/src/**/*.ts` |
| event-bus | `libs/event-bus/src/**/*.ts` |
| testing | `libs/testing/src/**/*.ts` |

#### Scenario: All libs get lint target

- GIVEN a library project.json (e.g. `libs/shared-kernel/project.json`) with `build` and `test` targets
- WHEN the `lint` target is added
- THEN the target MUST use `"executor": "@nx/eslint:lint"`
- AND `options.lintFilePatterns` MUST include only the `src/` directory glob

### Requirement: Lint Command Runs All Projects

The `pnpm lint` script (defined as `nx run-many -t lint`) MUST exit 0 after the lint targets are added.

#### Scenario: pnpm lint passes

- GIVEN all 12 project.json files have a `lint` target
- WHEN `pnpm lint` is executed
- THEN it MUST exit with code 0

#### Scenario: Partial lint targets fail

- GIVEN one or more project.json files are missing the `lint` target
- WHEN `pnpm lint` is executed
- THEN it MUST exit with a non-zero code
- AND the output MUST indicate which projects are missing the lint executor

### Requirement: Roadmap Updated

The implementation roadmap MUST reflect task 105 (ESLint) as complete.

#### Scenario: Roadmap marks Task 105 done

- GIVEN all 12 project.json files have `lint` targets
- WHEN `docs/09-tracking/implementation-roadmap.md` is updated
- THEN the `setup-local-infrastructure` OpenSpec change MUST be marked `[x]`
