import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

/**
 * Module that exposes the service health check endpoint at `GET /health`.
 *
 * Returns basic process health information: `{ status, timestamp, uptime }`.
 * For dependency-specific checks, extend with `@nestjs/terminus` health indicators
 * by adding custom health controllers or indicators to this module.
 *
 * @example
 * ```typescript
 * import { HealthModule } from '@payroll/service-foundation';
 *
 * @Module({
 *   imports: [HealthModule],
 * })
 * export class AppModule {}
 * ```
 */
@Module({
  controllers: [HealthController],
})
export class HealthModule {}
