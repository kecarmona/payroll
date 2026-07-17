import { Controller, Get, Header } from '@nestjs/common';
import { MetricsService } from './metrics.service';

/**
 * Controller that exposes Prometheus metrics at `GET /api/metrics`.
 *
 * Returns metrics in the Prometheus exposition format (`text/plain`).
 * Intended to be scraped by Prometheus or viewed directly for debugging.
 */
@Controller()
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  /**
   * Returns all registered metrics in Prometheus exposition format.
   *
   * @returns A string of Prometheus-formatted metrics
   */
  @Get('/api/metrics')
  @Header('content-type', 'text/plain')
  async getMetrics(): Promise<string> {
    return this.metricsService.getMetrics();
  }
}
