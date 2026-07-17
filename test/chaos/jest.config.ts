import type { Config } from 'jest';

/**
 * Jest configuration for the Chaos / Resilience test suite.
 *
 * This suite validates system resilience by injecting controlled failures
 * (service stops, consumer crashes, duplicate messages) and verifying
 * correct system behaviour during and after recovery.
 *
 * ## Prerequisites
 *
 * - Full Docker Compose stack running (postgres, mongodb, redis, kafka)
 * - All 8 microservices running (ports 3001–3008)
 *
 * ## Design Notes
 *
 * - `testTimeout: 180_000` — generous timeout for failure injection + recovery
 * - `forceExit: true` — avoids hanging after Kafka / docker exec handles
 * - `globals: { EVIDENCE_DIR }` — path for structured evidence JSON output
 */
const config: Config = {
  testEnvironment: 'node',
  rootDir: '.',
  roots: ['<rootDir>'],
  testMatch: ['**/scenarios/**/*.spec.ts'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.chaos.json',
      },
    ],
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  testTimeout: 180_000,
  forceExit: true,
  detectOpenHandles: true,
  verbose: true,
  /** Prevent Nx module resolution from interfering with direct imports. */
  moduleNameMapper: {},
};

export default config;
