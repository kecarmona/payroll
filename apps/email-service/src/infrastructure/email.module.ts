import { Module, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmEmailDeliveryEntity } from './typeorm-email-delivery.entity';
import { TypeOrmEmailDeliveryRepository } from './typeorm-email-delivery.repository';
import { DevEmailAdapter } from './dev-email-adapter';

/**
 * Injection tokens for domain port implementations.
 *
 * Enables NestJS DI to resolve domain port interfaces that are
 * erased at runtime (TypeScript interfaces).
 */
export const EMAIL_SENDER_TOKEN = 'EmailSender';
export const EMAIL_DELIVERY_REPOSITORY_TOKEN = 'EmailDeliveryRepository';

/**
 * NestJS module that wires the infrastructure layer for the Email Service.
 *
 * Registers the TypeORM entity for the `email_deliveries` table and binds
 * all infrastructure implementations to their domain port interfaces via
 * string injection tokens.
 *
 * ## Provided Bindings
 *
 * | Token | Implementation | Domain Port |
 * |-------|---------------|-------------|
 * | `'EmailSender'` | {@link DevEmailAdapter} | {@link EmailSender} |
 * | `'EmailDeliveryRepository'` | {@link TypeOrmEmailDeliveryRepository} | — |
 *
 * ## Usage
 *
 * ```ts
 * // app.module.ts
 * @Module({
 *   imports: [EmailModule],
 * })
 * export class AppModule {}
 * ```
 */
@Module({
  imports: [TypeOrmModule.forFeature([TypeOrmEmailDeliveryEntity])],
  providers: [
    {
      provide: EMAIL_SENDER_TOKEN,
      useFactory: () => new DevEmailAdapter(new Logger(DevEmailAdapter.name)),
    },
    {
      provide: EMAIL_DELIVERY_REPOSITORY_TOKEN,
      useClass: TypeOrmEmailDeliveryRepository,
    },
  ],
  exports: [EMAIL_SENDER_TOKEN, EMAIL_DELIVERY_REPOSITORY_TOKEN],
})
export class EmailModule {}
