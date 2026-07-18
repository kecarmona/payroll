/**
 * Record stored in the idempotency store.
 *
 * Represents a previously processed request, enabling safe replay.
 */
export interface IdempotencyRecord {
  /** The idempotency key value. */
  readonly key: string;
  /** Hash of the request payload for conflict detection. */
  readonly requestHash: string;
  /** HTTP status code from the original response. */
  readonly responseStatus: number;
  /** JSON response body from the original response. */
  readonly responseBody: unknown;
  /** Timestamp when the record was created. */
  readonly createdAt: Date;
}

/**
 * Port interface for idempotency storage operations.
 *
 * Defines the contract for reading and writing idempotency records.
 * The implementation lives in the infrastructure layer (TypeORM).
 */
export interface IdempotencyStore {
  /**
   * Finds an idempotency record by its key.
   *
   * @param key - The idempotency key to look up.
   * @returns The IdempotencyRecord, or `null` if not found.
   */
  findByKey(key: string): Promise<IdempotencyRecord | null>;

  /**
   * Persists an idempotency record.
   *
   * @param record - The idempotency record to save.
   */
  save(record: IdempotencyRecord): Promise<void>;
}
