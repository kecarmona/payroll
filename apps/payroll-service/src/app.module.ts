import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AuthGuardsModule } from '@payroll/auth-guards';
import { ObservabilityModule, MetricsController } from '@payroll/observability';
import { TransactionalOutboxModule } from '@payroll/transactional-outbox';
import { HealthController } from './health.controller';
import { PayrollModule, PAYROLL_PERIOD_REPOSITORY_TOKEN, PAYROLL_JOB_REPOSITORY_TOKEN, IDEMPOTENCY_STORE_TOKEN } from './infrastructure/payroll.module';
import { PayrollController } from './interface/payroll.controller';
import { CreatePayrollPeriodHandler } from './application/create-payroll-period.command';
import { CreatePayrollJobHandler } from './application/create-payroll-job.command';
import { GetPayrollJobHandler } from './application/queries/get-payroll-job.query';
import { ListPayrollPeriodsHandler } from './application/queries/list-payroll-periods.query';
import { IdempotencyGuard } from './interface/guards/idempotency.guard';
import { OutboxPublisherService } from './infrastructure/outbox-publisher.service';

/**
 * Root application module for the Payroll Service.
 *
 * Configures:
 * - Environment variable loading via `@nestjs/config`
 * - TypeORM connection to PostgreSQL (payroll database)
 * - Payroll domain infrastructure (repositories)
 * - Shared transactional outbox module for event persistence
 * - Application command and query handlers
 * - Idempotency guard for safe request retry
 * - HTTP interface (controllers)
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
      database: process.env.DATABASE_NAME ?? 'payroll_payroll',
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    AuthGuardsModule,
    PayrollModule,
    TransactionalOutboxModule.forRoot(),
    ObservabilityModule,
  ],
  controllers: [HealthController, PayrollController, MetricsController],
  providers: [
    IdempotencyGuard,
    OutboxPublisherService,
    // Application command handlers — injected with infrastructure implementations
    {
      provide: CreatePayrollPeriodHandler,
      inject: [PAYROLL_PERIOD_REPOSITORY_TOKEN],
      useFactory: (
        payrollPeriodRepository: unknown,
      ) => new CreatePayrollPeriodHandler(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        payrollPeriodRepository as any,
      ),
    },
    {
      provide: CreatePayrollJobHandler,
      inject: [
        DataSource,
        PAYROLL_PERIOD_REPOSITORY_TOKEN,
        PAYROLL_JOB_REPOSITORY_TOKEN,
        IDEMPOTENCY_STORE_TOKEN,
        'OutboxStore',
      ],
      useFactory: (
        dataSource: unknown,
        payrollPeriodRepository: unknown,
        payrollJobRepository: unknown,
        idempotencyStore: unknown,
        outboxStore: unknown,
      ) => new CreatePayrollJobHandler(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dataSource as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        payrollPeriodRepository as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        payrollJobRepository as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        idempotencyStore as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        outboxStore as any,
      ),
    },
    // Query handlers — only need the repository for read operations
    {
      provide: GetPayrollJobHandler,
      inject: [PAYROLL_JOB_REPOSITORY_TOKEN],
      useFactory: (
        payrollJobRepository: unknown,
      ) => new GetPayrollJobHandler(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        payrollJobRepository as any,
      ),
    },
    {
      provide: ListPayrollPeriodsHandler,
      inject: [PAYROLL_PERIOD_REPOSITORY_TOKEN],
      useFactory: (
        payrollPeriodRepository: unknown,
      ) => new ListPayrollPeriodsHandler(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        payrollPeriodRepository as any,
      ),
    },
  ],
})
export class AppModule {}
