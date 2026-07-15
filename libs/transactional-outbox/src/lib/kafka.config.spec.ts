import {
  KafkaConfig,
  DEFAULT_KAFKA_BROKER,
  DEFAULT_POLL_INTERVAL_MS,
  DEFAULT_BATCH_SIZE,
  kafkaConfigFromEnv,
} from './kafka.config';

describe('KafkaConfig', () => {
  describe('default constants', () => {
    it('should have a default broker of localhost:9092', () => {
      expect(DEFAULT_KAFKA_BROKER).toBe('localhost:9092');
    });

    it('should have a default poll interval of 5000ms', () => {
      expect(DEFAULT_POLL_INTERVAL_MS).toBe(5000);
    });

    it('should have a default batch size of 50', () => {
      expect(DEFAULT_BATCH_SIZE).toBe(50);
    });
  });

  it('should accept a valid config object with all properties', () => {
    const config: KafkaConfig = {
      broker: 'kafka:9092',
      pollIntervalMs: 10000,
      batchSize: 100,
    };

    expect(config.broker).toBe('kafka:9092');
    expect(config.pollIntervalMs).toBe(10000);
    expect(config.batchSize).toBe(100);
  });

  it('should create config from env vars with defaults when env vars are not set', () => {
    const config = kafkaConfigFromEnv({});

    expect(config.broker).toBe(DEFAULT_KAFKA_BROKER);
    expect(config.pollIntervalMs).toBe(DEFAULT_POLL_INTERVAL_MS);
    expect(config.batchSize).toBe(DEFAULT_BATCH_SIZE);
  });

  it('should read KAFKA_BROKER from env vars', () => {
    const config = kafkaConfigFromEnv({ KAFKA_BROKER: 'kafka-cluster:9092' });

    expect(config.broker).toBe('kafka-cluster:9092');
  });

  it('should read OUTBOX_POLL_INTERVAL_MS from env vars', () => {
    const config = kafkaConfigFromEnv({ OUTBOX_POLL_INTERVAL_MS: '10000' });

    expect(config.pollIntervalMs).toBe(10000);
  });

  it('should read OUTBOX_BATCH_SIZE from env vars', () => {
    const config = kafkaConfigFromEnv({ OUTBOX_BATCH_SIZE: '100' });

    expect(config.batchSize).toBe(100);
  });
});
