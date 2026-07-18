/**
 * Core application configuration loaded from environment variables.
 */
export interface AppConfig {
  /** The runtime environment (development, production, test). */
  nodeEnv: string;
  /** The HTTP port the service listens on. */
  port: number;
  /** The name of this service (e.g., "auth-service"). */
  serviceName: string;
}

/**
 * PostgreSQL database connection configuration.
 */
export interface DatabaseConfig {
  /** Database host address. */
  host: string;
  /** Database port number. */
  port: number;
  /** Database name. */
  database: string;
}

/**
 * Apache Kafka connection configuration.
 */
export interface KafkaConfig {
  /** Comma-separated list of Kafka broker addresses. */
  brokers: string[];
  /** Kafka client group/application identifier. */
  clientId: string;
}

/**
 * Redis connection configuration.
 */
export interface RedisConfig {
  /** Redis connection URL. */
  url: string;
}
