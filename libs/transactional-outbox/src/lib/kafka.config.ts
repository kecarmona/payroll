/**
 * Configuration interface for the Kafka outbox publisher.
 *
 * All values have sensible defaults and can be overridden via
 * environment variables or programmatic configuration.
 */
export interface KafkaConfig {
  /** Kafka broker address (e.g. 'localhost:9092'). */
  broker: string;
  /** Poll interval in milliseconds between outbox table polls. */
  pollIntervalMs: number;
  /** Maximum number of outbox records to process per poll cycle. */
  batchSize: number;
}

/** Default Kafka broker address. */
export const DEFAULT_KAFKA_BROKER = 'localhost:9092';

/** Default outbox poll interval in milliseconds. */
export const DEFAULT_POLL_INTERVAL_MS = 5000;

/** Default maximum records per poll cycle. */
export const DEFAULT_BATCH_SIZE = 50;

/**
 * Creates a {@link KafkaConfig} from environment variables with sensible defaults.
 *
 * @param env - The environment object (defaults to `process.env`).
 * @returns A fully populated KafkaConfig.
 */
export function kafkaConfigFromEnv(
  env: Record<string, string | undefined> = process.env,
): KafkaConfig {
  return {
    broker: env['KAFKA_BROKER'] ?? DEFAULT_KAFKA_BROKER,
    pollIntervalMs: Number(env['OUTBOX_POLL_INTERVAL_MS'] ?? DEFAULT_POLL_INTERVAL_MS),
    batchSize: Number(env['OUTBOX_BATCH_SIZE'] ?? DEFAULT_BATCH_SIZE),
  };
}
