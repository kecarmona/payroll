import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmEmployeeEntity } from './persistence/typeorm-employee.entity';
import { TypeOrmEmployeeRepository } from './persistence/typeorm-employee.repository';
import { EmployeeDomainEventPublisherImpl } from './events/domain-event-publisher';

/**
 * Injection tokens for domain port implementations.
 *
 * These string tokens enable NestJS DI to resolve domain port interfaces
 * that are erased at runtime (TypeScript interfaces). Application-layer
 * handlers use `@Inject(token)` to receive the concrete implementation.
 *
 * @example
 * ```ts
 * class CreateEmployeeHandler {
 *   constructor(
 *     @Inject('EmployeeRepository')
 *     private readonly employeeRepository: EmployeeRepository,
 *   ) {}
 * }
 * ```
 */
export const EMPLOYEE_REPOSITORY_TOKEN = 'EmployeeRepository';
export const EVENT_PUBLISHER_TOKEN = 'EventPublisher';

/**
 * NestJS module that wires the infrastructure layer for the Employee Service.
 *
 * Registers the TypeORM entity for the `employees` table and binds all
 * infrastructure implementations to their domain port interfaces via
 * string injection tokens.
 *
 * ## Provided Bindings
 *
 * | Token | Implementation | Domain Port |
 * |---|---|---|
 * | `'EmployeeRepository'` | {@link TypeOrmEmployeeRepository} | {@link EmployeeRepository} |
 * | `'EventPublisher'` | {@link EmployeeDomainEventPublisherImpl} | {@link EventPublisher} |
 *
 * ## Usage
 *
 * ```ts
 * // app.module.ts
 * @Module({
 *   imports: [EmployeeModule],
 * })
 * export class AppModule {}
 * ```
 *
 * ```ts
 * // In a handler or controller:
 * @Injectable()
 * class SomeHandler {
 *   constructor(
 *     @Inject('EmployeeRepository')
 *     private readonly employeeRepository: EmployeeRepository,
 *   ) {}
 * }
 * ```
 */
@Module({
  imports: [TypeOrmModule.forFeature([TypeOrmEmployeeEntity])],
  providers: [
    {
      provide: EMPLOYEE_REPOSITORY_TOKEN,
      useClass: TypeOrmEmployeeRepository,
    },
    {
      provide: EVENT_PUBLISHER_TOKEN,
      useClass: EmployeeDomainEventPublisherImpl,
    },
  ],
  exports: [EMPLOYEE_REPOSITORY_TOKEN, EVENT_PUBLISHER_TOKEN],
})
export class EmployeeModule {}
