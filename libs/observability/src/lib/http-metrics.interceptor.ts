import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Response } from 'express';
import { MetricsService } from './metrics.service';

/**
 * Interceptor that records HTTP request count and duration metrics.
 *
 * Attaches to every route when registered globally via `APP_INTERCEPTOR`.
 * Uses `tap()` on the response observable to capture the final status
 * code after all middleware, guards, pipes, and handlers have completed.
 */
@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const start = Date.now();
    const request = context.switchToHttp().getRequest<{
      method: string;
      route?: { path?: string };
      path?: string;
    }>();

    const method = request.method;
    const path = request.route?.path ?? request.path ?? 'unknown';

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse<Response>();
          const status = String(response.statusCode);
          const duration = Date.now() - start;

          this.metricsService.incrementHttpRequest(method, path, status);
          this.metricsService.observeHttpDuration(method, path, status, duration);
        },
        error: () => {
          const response = context.switchToHttp().getResponse<Response>();
          const status = String(response.statusCode);
          const duration = Date.now() - start;

          this.metricsService.incrementHttpRequest(method, path, status);
          this.metricsService.observeHttpDuration(method, path, status, duration);
        },
      }),
    );
  }
}
