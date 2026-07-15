import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { TransactionalOutboxModule } from '@payroll/transactional-outbox';
import { HealthController } from './health.controller';
import {
  PayrollProcessingModule,
  PAYROLL_TRANSACTION_REPOSITORY_TOKEN,
  PAYSLIP_REPOSITORY_TOKEN,
  PROCESSED_EVENT_STORE_TOKEN,
  PAYROLL_CALCULATION_SERVICE_TOKEN,
} from './infrastructure/payroll-processing.module';
import { ProcessPayrollJobHandler } from './application/process-payroll-job.command';
import { ProcessTransactionHandler } from './application/process-transaction.command';
import { PayrollJobConsumer } from './interface/kafka/payroll-job-consumer';
import { KafkaConsumerService } from './interface/kafka/kafka-consumer.service';

/**
 * Root application module for the Payroll Processing Service.
 *
 * Configures:
 * - Environment variable loading via `@nestjs/config`
 * - TypeORM connection to PostgreSQL (payroll-processing database)
 * - Payroll Processing domain infrastructure (repositories)
 * - Shared transactional outbox module for event persistence
 * - Application command handlers
 * - Kafka consumer for inbound payroll events
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST ?? 'localhost',
      port: Number(process.env.DATABASE_PORT ?? 5432),
      username: process.env.DATABASE_USER ?? 'payroll',
      password: process.env.DATABASE_PASSWORD ?? 'payroll',
      database: process.env.DATABASE_NAME ?? 'payroll_processing',
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    PayrollProcessingModule,
    TransactionalOutboxModule.forRoot(),
  ],
  controllers: [HealthController],
  providers: [
    // ── Application command handlers ────────────────────────────
    {
      provide: ProcessPayrollJobHandler,
      inject: [
        DataSource,
        PAYROLL_TRANSACTION_REPOSITORY_TOKEN,
        PROCESSED_EVENT_STORE_TOKEN,
      ],
      useFactory: (
        dataSource: unknown,
        transactionRepository: unknown,
        processedEventStore: unknown,
      ) =>
        new ProcessPayrollJobHandler(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          dataSource as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          transactionRepository as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          processedEventStore as any,
        ),
    },
    {
      provide: ProcessTransactionHandler,
      inject: [
        DataSource,
        PAYROLL_TRANSACTION_REPOSITORY_TOKEN,
        PAYSLIP_REPOSITORY_TOKEN,
        PAYROLL_CALCULATION_SERVICE_TOKEN,
      ],
      useFactory: (
        dataSource: unknown,
        transactionRepository: unknown,
        payslipRepository: unknown,
        calculationService: unknown,
      ) =>
        new ProcessTransactionHandler(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          dataSource as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          transactionRepository as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          payslipRepository as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          calculationService as any,
        ),
    },
    // ── Kafka consumer ──────────────────────────────────────────
    {
      provide: KafkaConsumerService,
      inject: [ProcessPayrollJobHandler],
      useFactory: (
        processPayrollJobHandler: ProcessPayrollJobHandler,
      ) => {
        const kafkaBroker = process.env['KAFKA_BROKER'] ?? 'localhost:9092';

        // Create the Kafka consumer service
        const consumerService = new KafkaConsumerService(
          {
            broker: kafkaBroker,
            clientId: 'payroll-processing-service',
            groupId: 'payroll-processing-group',
            topic: 'payroll.events',
          },
          {
            deserialize: <T>(data: Buffer) => {
              const parsed = JSON.parse(data.toString('utf-8'));
              // Validate required envelope fields
              if (!parsed.eventId || !parsed.eventType || !parsed.payload) {
                throw new Error('Invalid event envelope: missing required fields');
              }
              return parsed as T;
            },
          },
        );

        // Register the PayrollJobCreated handler
        consumerService.registerHandler(
          new PayrollJobConsumer(processPayrollJobHandler),
        );

        return consumerService;
      },
    },
  ],
  exports: [],
})
export class AppModule {}
