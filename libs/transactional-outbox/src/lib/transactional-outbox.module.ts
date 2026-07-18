import { DynamicModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmOutboxRepository } from './typeorm-outbox.repository';
import { TypeOrmOutboxEntity } from './typeorm-outbox.entity';

/**
 * Injection token for the {@link OutboxStore} port.
 *
 * Use this token with `@Inject(OUTBOX_STORE_TOKEN)` in consuming classes
 * to receive the configured {@link TypeOrmOutboxRepository} implementation.
 */
export const OUTBOX_STORE_TOKEN = 'OutboxStore';

/**
 * NestJS dynamic module for the transactional outbox infrastructure.
 *
 * Provides the {@link OutboxStore} port implementation backed by TypeORM.
 * Consumers call {@link forRoot} to register the module.
 *
 * The module registers {@link TypeOrmOutboxEntity} via `TypeOrmModule.forFeature`,
 * making it available for injection in the application's configured DataSource.
 * The {@link TypeOrmOutboxRepository} receives the DataSource automatically
 * via NestJS DI from the parent module's `TypeOrmModule.forRoot`.
 *
 * @example
 * ```ts
 * // In your application module:
 * import { TransactionalOutboxModule } from '@payroll/transactional-outbox';
 *
 * @Module({
 *   imports: [
 *     TypeOrmModule.forRoot({ ... }),   // Must be configured first
 *     TransactionalOutboxModule.forRoot(),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class TransactionalOutboxModule {
  /**
   * Creates a dynamic module providing the outbox store.
   *
   * @returns A dynamic module with `OutboxStore` provider and entity export.
   */
  static forRoot(): DynamicModule {
    return {
      module: TransactionalOutboxModule,
      imports: [TypeOrmModule.forFeature([TypeOrmOutboxEntity])],
      providers: [
        {
          provide: OUTBOX_STORE_TOKEN,
          useClass: TypeOrmOutboxRepository,
        },
      ],
      exports: [OUTBOX_STORE_TOKEN, TypeOrmModule],
    };
  }
}
