import { Controller, Get } from '@nestjs/common';

/**
 * Response shape returned by the health check endpoint.
 */
export interface HealthCheckResult {
  /** Service status: "ok" when healthy. */
  status: 'ok' | 'error';
  /** ISO-8601 timestamp of the check. */
  timestamp: string;
  /** Process uptime in seconds. */
  uptime: number;
}

/**
 * Controller that exposes the service health check endpoint.
 *
 * Returns basic process health information (status, uptime, timestamp).
 * For dependency-specific checks, extend with `@nestjs/terminus` health
 * indicators.
 */
@Controller('health')
export class HealthController {
  @Get()
  check(): HealthCheckResult {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
