/**
 * Provides a fixed correlation ID for deterministic test assertions.
 *
 * When a service under test logs messages or sends events, the
 * correlation ID is always `"test-correlation-id"` instead of a
 * random UUID, making assertions predictable.
 *
 * @example
 * ```typescript
 * import { MockCorrelationIdProvider } from '@payroll/testing';
 *
 * const mockCorrelationId = new MockCorrelationIdProvider('fixed-id');
 * ```
 */
export class MockCorrelationIdProvider {
  /**
   * @param correlationId - The fixed correlation ID to use in tests.
   */
  constructor(public readonly correlationId: string) {}

  /**
   * Returns the fixed correlation ID.
   */
  getCorrelationId(): string {
    return this.correlationId;
  }
}
