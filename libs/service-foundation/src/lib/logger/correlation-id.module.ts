import { DynamicModule, Module } from '@nestjs/common';
import { CorrelationIdMiddleware } from './correlation-id.middleware';

/**
 * Module that registers the CorrelationIdMiddleware for correlation ID propagation.
 *
 * Import this module in any service that needs correlation ID tracking.
 * The middleware itself must be applied in the consumer's module via
 * `configure()` or NestJS middleware configuration.
 *
 * Services can access the correlation ID via the static method:
 * `CorrelationIdMiddleware.getCorrelationId()`
 *
 * @example
 * ```typescript
 * // In your AppModule:
 * import { CorrelationIdModule } from '@payroll/service-foundation';
 *
 * @Module({
 *   imports: [CorrelationIdModule],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class CorrelationIdModule {
  static forRoot(): DynamicModule {
    return {
      module: CorrelationIdModule,
      providers: [CorrelationIdMiddleware],
      exports: [CorrelationIdMiddleware],
    };
  }
}
