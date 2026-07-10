/**
 * Creates a partial mock configuration object suitable for unit tests.
 *
 * Returns typed config objects (`AppConfig`, `DatabaseConfig`, `KafkaConfig`)
 * with sensible defaults so services under test receive valid configuration
 * without requiring actual environment variables.
 *
 * @example
 * ```typescript
 * import { createTestingConfig } from '@payroll/testing';
 *
 * const config = createTestingConfig();
 * console.log(config.app.serviceName); // "test-service"
 * ```
 */
export function createTestingConfig() {
  return {
    app: {
      nodeEnv: 'test',
      port: 3000,
      serviceName: 'test-service',
    },
    database: {
      host: 'localhost',
      port: 5432,
      database: 'payroll_test',
    },
    kafka: {
      brokers: ['localhost:9092'],
      clientId: 'test-client',
    },
    redis: {
      url: 'redis://localhost:6379',
    },
  };
}
