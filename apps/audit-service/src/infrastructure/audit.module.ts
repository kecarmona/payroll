import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmAuditRecordEntity } from './persistence/typeorm-audit-record.entity';
import { TypeOrmProcessedEventEntity } from './persistence/typeorm-processed-event.entity';
import { TypeOrmAuditRecordRepository } from './persistence/typeorm-audit-record.repository';
import { TypeOrmProcessedEventRepository } from './persistence/typeorm-processed-event.repository';
import { RedactionService } from '../domain/redaction.service';
import { RecordAuditEventHandler } from '../application/record-audit-event.handler';
import { AuditConsumer } from '../interface/kafka/audit-consumer';

/**
 * Injection tokens for domain port implementations.
 */
export const AUDIT_RECORD_REPOSITORY_TOKEN = 'AuditRecordRepository';
export const PROCESSED_EVENT_STORE_TOKEN = 'ProcessedEventStore';
export const REDACTION_SERVICE_TOKEN = 'RedactionService';
export const AUDIT_EVENT_HANDLER_TOKEN = 'RecordAuditEventHandler';

/**
 * NestJS module that wires the infrastructure layer for the Audit Service.
 *
 * Registers TypeORM entities for the `audit_records` and `processed_events`
 * tables, and binds all infrastructure implementations to their domain port
 * interfaces via string injection tokens.
 *
 * ## Provided Bindings
 *
 * | Token | Implementation | Domain Port |
 * |---|---|---|
 * | `'AuditRecordRepository'` | {@link TypeOrmAuditRecordRepository} | {@link AuditRecordRepository} |
 * | `'ProcessedEventStore'` | {@link TypeOrmProcessedEventRepository} | {@link ProcessedEventStore} |
 * | `'RedactionService'` | {@link RedactionService} | — (concrete class) |
 * | `'RecordAuditEventHandler'` | {@link RecordAuditEventHandler} | — (application service) |
 *
 * ## Usage
 *
 * ```ts
 * // app.module.ts
 * @Module({
 *   imports: [AuditModule],
 * })
 * export class AppModule {}
 * ```
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([TypeOrmAuditRecordEntity, TypeOrmProcessedEventEntity]),
  ],
  providers: [
    // Domain services
    RedactionService,

    // Infrastructure implementations mapped to domain port tokens
    {
      provide: AUDIT_RECORD_REPOSITORY_TOKEN,
      useClass: TypeOrmAuditRecordRepository,
    },
    {
      provide: PROCESSED_EVENT_STORE_TOKEN,
      useClass: TypeOrmProcessedEventRepository,
    },

    // Application handlers
    {
      provide: RecordAuditEventHandler,
      inject: [AUDIT_RECORD_REPOSITORY_TOKEN, PROCESSED_EVENT_STORE_TOKEN, RedactionService],
      useFactory: (
        auditRecordRepository: TypeOrmAuditRecordRepository,
        processedEventStore: TypeOrmProcessedEventRepository,
        redactionService: RedactionService,
      ) => new RecordAuditEventHandler(auditRecordRepository, processedEventStore, redactionService),
    },

    // Interface adapters
    {
      provide: AuditConsumer,
      inject: [RecordAuditEventHandler],
      useFactory: (handler: RecordAuditEventHandler) => new AuditConsumer(handler),
    },
  ],
  exports: [
    AUDIT_RECORD_REPOSITORY_TOKEN,
    PROCESSED_EVENT_STORE_TOKEN,
    AuditConsumer,
  ],
})
export class AuditModule {}
