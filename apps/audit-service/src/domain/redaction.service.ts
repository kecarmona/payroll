/**
 * Service for redacting sensitive fields from event payloads.
 *
 * The `RedactionService` ensures that sensitive personally identifiable
 * information (PII) and secrets are never stored in plain text within
 * audit records. It returns a new object with sensitive field values
 * replaced by `'[REDACTED]'` — the original payload is never mutated.
 *
 * Redaction operates at the **top level** of the payload only. Nested
 * objects with sensitive keys are not recursively redacted, as the
 * audited event payloads are flat by convention.
 *
 * @example
 * ```ts
 * const redactionService = new RedactionService();
 * const safe = redactionService.redact({ ssn: '123-45-6789', name: 'John' });
 * // safe → { ssn: '[REDACTED]', name: 'John' }
 * ```
 */
export class RedactionService {
  /**
   * Keys whose values are considered sensitive and MUST be redacted.
   *
   * This list covers:
   * - US tax identifiers: `ssn`, `taxId`
   * - Banking details: `bankAccount`, `iban`, `routingNumber`
   * - Authentication secrets: `password`, `token`, `secret`, `refreshToken`
   */
  private readonly sensitiveKeys = new Set([
    'ssn',
    'taxId',
    'bankAccount',
    'iban',
    'routingNumber',
    'password',
    'token',
    'secret',
    'refreshToken',
  ]);

  /**
   * Produces a redacted copy of the given payload.
   *
   * Sensitive fields have their values replaced with `'[REDACTED]'`.
   * Non-sensitive fields are preserved as-is. The original payload is
   * never modified.
   *
   * @param payload - The raw event payload containing potentially sensitive data.
   * @returns A new object with sensitive values replaced by `'[REDACTED]'`.
   */
  redact(payload: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(payload)) {
      result[key] = this.sensitiveKeys.has(key) ? '[REDACTED]' : value;
    }

    return result;
  }
}
