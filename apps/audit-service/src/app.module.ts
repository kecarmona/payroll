import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health.controller';
import { AuditModule } from './infrastructure/audit.module';

/**
 * Root application module for the Audit Service.
 *
 * Configures:
 * - Environment variable loading via `@nestjs/config`
 * - TypeORM connection to PostgreSQL for audit data persistence
 * - Audit domain infrastructure (repositories, redaction, event handling)
 * - Kafka consumer for the `audit.events` topic
 *
 * The audit service is **append-only** — it writes audit records and
 * idempotency markers, but exposes no REST endpoints other than health.
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
      database: process.env.DATABASE_NAME ?? 'payroll_audit',
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    AuditModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}

