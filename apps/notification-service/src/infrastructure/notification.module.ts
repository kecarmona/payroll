import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionalOutboxModule } from '@payroll/transactional-outbox';
import { TypeOrmNotificationRequestEntity } from './typeorm-notification-request.entity';
import { TypeOrmProcessedEventEntity } from './typeorm-processed-event.entity';
import { TypeOrmNotificationRequestRepository } from './typeorm-notification-request.repository';
import { TypeOrmProcessedEventRepository } from './typeorm-processed-event.repository';

/**
 * Injection tokens for domain port implementations.
 *
 * Enables NestJS DI to resolve domain port interfaces that are
 * erased at runtime (TypeScript interfaces).
 */
export const PROCESSED_EVENT_STORE_TOKEN = 'ProcessedEventStore';

/**
 * NestJS module that wires the infrastructure layer for the Notification Service.
 *
 * Registers TypeORM entities for the `notification_requests` and
 * `processed_events` tables, and binds all infrastructure implementations
 * to their domain port interfaces via string injection tokens.
 *
 * ## Provided Bindings
 *
 * | Token | Implementation | Domain Port |
 * |-------|---------------|-------------|
 * | `'ProcessedEventStore'` | {@link TypeOrmProcessedEventRepository} | {@link ProcessedEventStore} |
 *
 * ## Usage
 *
 * ```ts
 * // app.module.ts
 * @Module({
 *   imports: [NotificationModule],
 * })
 * export class AppModule {}
 * ```
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([TypeOrmNotificationRequestEntity, TypeOrmProcessedEventEntity]),
    TransactionalOutboxModule.forRoot(),
  ],
  providers: [
    TypeOrmNotificationRequestRepository,
    {
      provide: PROCESSED_EVENT_STORE_TOKEN,
      useClass: TypeOrmProcessedEventRepository,
    },
  ],
  exports: [PROCESSED_EVENT_STORE_TOKEN, TypeOrmNotificationRequestRepository],
})
export class NotificationModule {}
