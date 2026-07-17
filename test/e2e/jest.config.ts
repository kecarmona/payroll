import type { Config } from 'jest';

/**
 * Jest configuration for the End-to-End Payroll Workflow test suite.
 *
 * This suite runs against all 8 microservices (auth, employee, payroll,
 * payroll-processing, projection, notification, email, audit) which MUST
 * be running before execution.
 *
 * The suite uses ts-jest for TypeScript transpilation, runs in `node`
 * environment (no jsdom), and has a generous 120s timeout to accommodate
 * async Kafka delivery latencies.
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
        tsconfig: '<rootDir>/tsconfig.e2e.json',
      },
    ],
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  testTimeout: 120_000,
  forceExit: true,
  detectOpenHandles: true,
  verbose: true,
  /** Prevent Nx module resolution from interfering with direct imports. */
  moduleNameMapper: {},
};

export default config;
