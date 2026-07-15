import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthGuardsModule } from '@payroll/auth-guards';
import { HealthController } from './health.controller';
import {
  NotificationModule,
  PROCESSED_EVENT_STORE_TOKEN,
} from './infrastructure/notification.module';
import { HandlePayslipGenerated } from './application/handle-payslip-generated';
import { OUTBOX_STORE_TOKEN } from '@payroll/transactional-outbox';

/**
 * Root application module for the Notification Service.
 *
 * Configures:
 * - Environment variable loading via `@nestjs/config`
 * - TypeORM connection to PostgreSQL (notifications database)
 * - Notification domain infrastructure (processed event store, notification requests)
 * - Application command handlers
 * - HTTP health endpoint
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }]),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST ?? 'localhost',
      port: Number(process.env.DATABASE_PORT ?? 5432),
      username: process.env.DATABASE_USER ?? 'payroll',
      password: process.env.DATABASE_PASSWORD ?? 'payroll',
      database: process.env.DATABASE_NAME ?? 'payroll_notifications',
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    AuthGuardsModule,
    NotificationModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: HandlePayslipGenerated,
      inject: [PROCESSED_EVENT_STORE_TOKEN, OUTBOX_STORE_TOKEN],
      useFactory: (
        processedEventStore: unknown,
        outboxStore: unknown,
      ) => new HandlePayslipGenerated(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        processedEventStore as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        outboxStore as any,
      ),
    },
  ],
})
export class AppModule {}
