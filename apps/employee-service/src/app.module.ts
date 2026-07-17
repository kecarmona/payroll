import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthGuardsModule } from '@payroll/auth-guards';
import { ObservabilityModule, MetricsController } from '@payroll/observability';
import { HealthController } from './health.controller';
import { EmployeeModule, EMPLOYEE_REPOSITORY_TOKEN, EVENT_PUBLISHER_TOKEN } from './infrastructure/employee.module';
import { EmployeeController } from './interface/employee.controller';
import { CreateEmployeeHandler } from './application/create-employee.command';
import { UpdateEmployeeHandler } from './application/update-employee.command';
import { ChangeSalaryHandler } from './application/change-salary.command';
import { TerminateEmployeeHandler } from './application/terminate-employee.command';
import { GetEmployeeHandler } from './application/queries/get-employee.query';
import { ListEmployeesHandler } from './application/queries/list-employees.query';

/**
 * Root application module for the Employee Service.
 *
 * Configures:
 * - Environment variable loading via `@nestjs/config`
 * - TypeORM connection to PostgreSQL (employees database)
 * - Employee domain infrastructure (repositories, event publisher)
 * - Application command and query handlers
 * - HTTP interface (controller)
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
      database: process.env.DATABASE_NAME ?? 'payroll_employees',
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    AuthGuardsModule,
    EmployeeModule,
    ObservabilityModule,
  ],
  controllers: [HealthController, EmployeeController, MetricsController],
  providers: [
    // Application command handlers — injected with infrastructure implementations
    {
      provide: CreateEmployeeHandler,
      inject: [EMPLOYEE_REPOSITORY_TOKEN, EVENT_PUBLISHER_TOKEN],
      useFactory: (
        employeeRepository: unknown,
        eventPublisher: unknown,
      ) => new CreateEmployeeHandler(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        employeeRepository as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        eventPublisher as any,
      ),
    },
    {
      provide: UpdateEmployeeHandler,
      inject: [EMPLOYEE_REPOSITORY_TOKEN, EVENT_PUBLISHER_TOKEN],
      useFactory: (
        employeeRepository: unknown,
        eventPublisher: unknown,
      ) => new UpdateEmployeeHandler(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        employeeRepository as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        eventPublisher as any,
      ),
    },
    {
      provide: ChangeSalaryHandler,
      inject: [EMPLOYEE_REPOSITORY_TOKEN, EVENT_PUBLISHER_TOKEN],
      useFactory: (
        employeeRepository: unknown,
        eventPublisher: unknown,
      ) => new ChangeSalaryHandler(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        employeeRepository as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        eventPublisher as any,
      ),
    },
    {
      provide: TerminateEmployeeHandler,
      inject: [EMPLOYEE_REPOSITORY_TOKEN, EVENT_PUBLISHER_TOKEN],
      useFactory: (
        employeeRepository: unknown,
        eventPublisher: unknown,
      ) => new TerminateEmployeeHandler(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        employeeRepository as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        eventPublisher as any,
      ),
    },
    // Query handlers — only need the repository for read operations
    {
      provide: GetEmployeeHandler,
      inject: [EMPLOYEE_REPOSITORY_TOKEN],
      useFactory: (
        employeeRepository: unknown,
      ) => new GetEmployeeHandler(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        employeeRepository as any,
      ),
    },
    {
      provide: ListEmployeesHandler,
      inject: [EMPLOYEE_REPOSITORY_TOKEN],
      useFactory: (
        employeeRepository: unknown,
      ) => new ListEmployeesHandler(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        employeeRepository as any,
      ),
    },
  ],
})
export class AppModule {}
