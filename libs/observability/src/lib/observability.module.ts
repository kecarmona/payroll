import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';
import { HttpMetricsInterceptor } from './http-metrics.interceptor';

/**
 * Global module that provides observability infrastructure.
 *
 * Registers:
 * - {@link MetricsService} — prometheus metric wrappers (exported for use in services)
 * - {@link HttpMetricsInterceptor} — global interceptor that records HTTP metrics
 * - {@link MetricsController} — exposes `GET /api/metrics` for Prometheus scraping
 *
 * @example
 * ```typescript
 * import { ObservabilityModule } from '@payroll/observability';
 *
 * @Module({
 *   imports: [ObservabilityModule],
 * })
 * export class AppModule {}
 * ```
 */
@Global()
@Module({
  controllers: [MetricsController],
  providers: [
    MetricsService,
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpMetricsInterceptor,
    },
  ],
  exports: [MetricsService],
})
export class ObservabilityModule {}
