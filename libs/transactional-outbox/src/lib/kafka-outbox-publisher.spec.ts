import { Logger } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import type { Producer } from 'kafkajs';
import type { EventSerializer } from '@payroll/event-bus';
import type { TopicRegistry, TopicName } from '@payroll/event-bus';
import { KafkaOutboxPublisher } from './kafka-outbox-publisher';
import { TypeOrmOutboxEntity } from './typeorm-outbox.entity';
import type { KafkaConfig } from './kafka.config';

describe('KafkaOutboxPublisher', () => {
  let publisher: KafkaOutboxPublisher;
  let mockDataSource: jest.Mocked<DataSource>;
  let mockRepo: jest.Mocked<Repository<TypeOrmOutboxEntity>>;
  let mockProducer: jest.Mocked<Producer>;
  let mockSerializer: jest.Mocked<EventSerializer>;
  let mockTopicRegistry: jest.Mocked<TopicRegistry>;
  let mockLogger: jest.Mocked<Logger>;
  let mockConfig: KafkaConfig;

  beforeEach(() => {
    mockRepo = {
      find: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<Repository<TypeOrmOutboxEntity>>;

    mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockRepo),
    } as unknown as jest.Mocked<DataSource>;

    mockProducer = {
      send: jest.fn().mockResolvedValue([{ errorCode: 0, topicName: 'test', partition: 0 }]),
      connect: jest.fn(),
      disconnect: jest.fn(),
    } as unknown as jest.Mocked<Producer>;

    mockSerializer = {
      serialize: jest.fn(),
    } as unknown as jest.Mocked<EventSerializer>;

    mockTopicRegistry = {
      resolve: jest.fn(),
    } as unknown as jest.Mocked<TopicRegistry>;

    mockLogger = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    mockConfig = {
      broker: 'localhost:9092',
      pollIntervalMs: 5000,
      batchSize: 50,
    };

    publisher = new KafkaOutboxPublisher(
      mockDataSource,
      mockProducer,
      mockSerializer,
      mockTopicRegistry,
      mockConfig,
      mockLogger,
    );
  });

  describe('publishPending', () => {
    it('should query unpublished records and publish them to Kafka', async () => {
      const pendingRecords: TypeOrmOutboxEntity[] = [
        {
          id: 'evt-001',
          eventType: 'PayrollJobCreated',
          aggregateId: 'job-456',
          payload: { jobId: 'job-456' },
          createdAt: new Date(),
          publishedAt: null,
          retryCount: 0,
          lastError: null,
        },
      ];

      mockRepo.find.mockResolvedValue(pendingRecords);
      mockSerializer.serialize.mockReturnValue(Buffer.from(JSON.stringify({ eventId: 'evt-001' })));
      mockTopicRegistry.resolve.mockReturnValue('payroll.job.created' as TopicName);

      await publisher.publishPending();

      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { publishedAt: expect.anything() },
        order: { createdAt: 'ASC' },
        take: 50,
      });
      expect(mockSerializer.serialize).toHaveBeenCalled();
      expect(mockTopicRegistry.resolve).toHaveBeenCalledWith('PayrollJobCreated');
      expect(mockProducer.send).toHaveBeenCalledWith({
        topic: 'payroll.job.created',
        messages: expect.arrayContaining([
          expect.objectContaining({ value: expect.any(Buffer) }),
        ]),
      });
      expect(mockRepo.update).toHaveBeenCalledWith(
        { id: 'evt-001' },
        { publishedAt: expect.any(Date) },
      );
    });

    it('should handle multiple pending records in a single poll', async () => {
      const pendingRecords: TypeOrmOutboxEntity[] = [
        {
          id: 'evt-001', eventType: 'PayrollJobCreated', aggregateId: 'job-1',
          payload: {}, createdAt: new Date(), publishedAt: null, retryCount: 0, lastError: null,
        },
        {
          id: 'evt-002', eventType: 'PayrollPeriodCreated', aggregateId: 'period-1',
          payload: {}, createdAt: new Date(), publishedAt: null, retryCount: 0, lastError: null,
        },
      ];

      mockRepo.find.mockResolvedValue(pendingRecords);
      mockSerializer.serialize.mockReturnValue(Buffer.from('{}'));
      mockTopicRegistry.resolve.mockImplementation(
        (eventType: string) => `topic.${eventType}` as TopicName,
      );

      await publisher.publishPending();

      expect(mockProducer.send).toHaveBeenCalledTimes(2);
      expect(mockRepo.update).toHaveBeenCalledTimes(2);
    });

    it('should do nothing when there are no pending records', async () => {
      mockRepo.find.mockResolvedValue([]);

      await publisher.publishPending();

      expect(mockRepo.find).toHaveBeenCalled();
      expect(mockProducer.send).not.toHaveBeenCalled();
    });

    it('should increment retryCount and log a warning on publish failure', async () => {
      const failedRecord: TypeOrmOutboxEntity = {
        id: 'evt-001',
        eventType: 'PayrollJobCreated',
        aggregateId: 'job-456',
        payload: {},
        createdAt: new Date(),
        publishedAt: null,
        retryCount: 0,
        lastError: null,
      };

      mockRepo.find.mockResolvedValue([failedRecord]);
      mockSerializer.serialize.mockReturnValue(Buffer.from('{}'));
      mockTopicRegistry.resolve.mockReturnValue('payroll.job.created' as TopicName);
      mockProducer.send.mockRejectedValue(new Error('Kafka broker unavailable'));

      await publisher.publishPending();

      expect(mockRepo.update).toHaveBeenCalledWith(
        { id: 'evt-001' },
        { retryCount: 1, lastError: 'Kafka broker unavailable' },
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('evt-001'),
      );
    });

    it('should process remaining records even when one fails', async () => {
      const records: TypeOrmOutboxEntity[] = [
        {
          id: 'evt-001', eventType: 'TypeA', aggregateId: 'agg-1',
          payload: {}, createdAt: new Date(), publishedAt: null, retryCount: 0, lastError: null,
        },
        {
          id: 'evt-002', eventType: 'TypeB', aggregateId: 'agg-2',
          payload: {}, createdAt: new Date(), publishedAt: null, retryCount: 0, lastError: null,
        },
      ];

      mockRepo.find.mockResolvedValue(records);
      mockSerializer.serialize.mockReturnValue(Buffer.from('{}'));
      mockTopicRegistry.resolve.mockImplementation((et: string) => `topic.${et}` as TopicName);
      mockProducer.send
        .mockRejectedValueOnce(new Error('First failed'))
        .mockResolvedValueOnce([{ errorCode: 0, topicName: 'topic.TypeB', partition: 0 }]);

      await publisher.publishPending();

      // First record: retry incremented
      expect(mockRepo.update).toHaveBeenCalledWith(
        { id: 'evt-001' },
        { retryCount: 1, lastError: 'First failed' },
      );
      // Second record: published
      expect(mockRepo.update).toHaveBeenCalledWith(
        { id: 'evt-002' },
        { publishedAt: expect.any(Date) },
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('evt-001'),
      );
    });

    it('should use the configured batch size for the query', async () => {
      const customConfig: KafkaConfig = {
        broker: 'localhost:9092',
        pollIntervalMs: 5000,
        batchSize: 10,
      };

      const customPublisher = new KafkaOutboxPublisher(
        mockDataSource,
        mockProducer,
        mockSerializer,
        mockTopicRegistry,
        customConfig,
        mockLogger,
      );

      mockRepo.find.mockResolvedValue([]);

      await customPublisher.publishPending();

      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { publishedAt: expect.anything() },
        order: { createdAt: 'ASC' },
        take: 10,
      });
    });

    it('should use the EventEnvelope for serialization structure', async () => {
      const pendingRecord: TypeOrmOutboxEntity = {
        id: 'evt-001',
        eventType: 'PayrollJobCreated',
        aggregateId: 'job-456',
        payload: { jobId: 'job-456' },
        createdAt: new Date('2026-07-14T12:00:00Z'),
        publishedAt: null,
        retryCount: 0,
        lastError: null,
      };

      mockRepo.find.mockResolvedValue([pendingRecord]);
      mockSerializer.serialize.mockReturnValue(Buffer.from('serialized'));
      mockTopicRegistry.resolve.mockReturnValue('payroll.job.created' as TopicName);

      await publisher.publishPending();

      // Verify the serializer received an EventEnvelope-like structure
      expect(mockSerializer.serialize).toHaveBeenCalledWith(
        expect.objectContaining({
          eventId: 'evt-001',
          eventType: 'PayrollJobCreated',
          payload: { jobId: 'job-456' },
        }),
      );
    });
  });
});
