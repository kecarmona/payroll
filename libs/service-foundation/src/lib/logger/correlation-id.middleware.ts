import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AsyncLocalStorage } from 'async_hooks';
import { v4 as uuidv4 } from 'uuid';

/**
 * Injection token for accessing the current request's correlation ID.
 *
 * Use with `@Inject(CORRELATION_ID_TOKEN)` in services that need the
 * correlation ID without depending on the request object directly.
 */
export const CORRELATION_ID_TOKEN = Symbol('CORRELATION_ID');

/**
 * Middleware that reads or generates a correlation ID for every incoming request.
 *
 * Reads the `x-correlation-id` header if present; otherwise generates a UUID v4.
 * Stores the value in `AsyncLocalStorage` so it is available throughout the
 * request lifecycle via the static `getCorrelationId()` accessor.
 *
 * @example
 * ```typescript
 * // In a service:
 * const correlationId = CorrelationIdMiddleware.getCorrelationId();
 * ```
 */
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  /** Per-request async context storage. */
  private static readonly asyncLocalStorage = new AsyncLocalStorage<string>();

  /**
   * Returns the correlation ID for the current request context.
   *
   * @returns The correlation ID string, or `undefined` if called outside
   * of a request context (e.g., during application bootstrap).
   */
  static getCorrelationId(): string | undefined {
    return CorrelationIdMiddleware.asyncLocalStorage.getStore();
  }

  use(req: Request, _res: Response, next: NextFunction): void {
    const correlationId =
      (req.headers['x-correlation-id'] as string | undefined) ?? uuidv4();

    CorrelationIdMiddleware.asyncLocalStorage.run(correlationId, () => {
      next();
    });
  }
}
