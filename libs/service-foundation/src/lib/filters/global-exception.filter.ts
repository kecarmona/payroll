import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { DomainError, ValidationError, NotFoundError } from '@payroll/shared-kernel';

/**
 * Standardised error response body returned by the global exception filter.
 */
export interface ErrorResponse {
  /** HTTP status code. */
  statusCode: number;
  /** Short error name or title. */
  error: string;
  /** Human-readable error description. */
  message: string;
  /** Correlation ID from the request context, or a fallback UUID. */
  correlationId: string;
  /** ISO-8601 timestamp of when the error occurred. */
  timestamp: string;
}

/**
 * Global exception filter that catches all unhandled exceptions and returns
 * a consistent `{ statusCode, error, message, correlationId, timestamp }`
 * response body.
 *
 * Error-to-HTTP mapping:
 * - `ValidationError` → 400 Bad Request
 * - `NotFoundError`   → 404 Not Found
 * - `HttpException`   → preserves the exception's own status code
 * - `DomainError`     → 422 Unprocessable Entity (fallback for unknown domain errors)
 * - `Error`           → 500 Internal Server Error (generic catch-all)
 *
 * @example
 * ```typescript
 * // main.ts
 * import { GlobalExceptionFilter } from '@payroll/service-foundation';
 *
 * async function bootstrap() {
 *   const app = await NestFactory.create(AppModule);
 *   app.useGlobalFilters(new GlobalExceptionFilter());
 *   await app.listen(3000);
 * }
 * ```
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const { statusCode, error, message } = this.resolveError(exception);

    const body: ErrorResponse = {
      statusCode,
      error,
      message,
      correlationId: uuidv4(),
      timestamp: new Date().toISOString(),
    };

    response.status(statusCode).json(body);
  }

  private resolveError(
    exception: unknown,
  ): { statusCode: number; error: string; message: string } {
    if (exception instanceof ValidationError) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'ValidationError',
        message: exception.message,
      };
    }

    if (exception instanceof NotFoundError) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        error: 'NotFoundError',
        message: exception.message,
      };
    }

    if (exception instanceof DomainError) {
      return {
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        error: exception.constructor.name,
        message: exception.message,
      };
    }

    if (exception instanceof HttpException) {
      const responseBody = exception.getResponse();
      const message =
        typeof responseBody === 'string'
          ? responseBody
          : (responseBody as Record<string, unknown>)['message'] ??
            exception.message;

      return {
        statusCode: exception.getStatus(),
        error: typeof message === 'string' ? message : exception.message,
        message: typeof message === 'string' ? message : exception.message,
      };
    }

    // Generic / unknown errors — never leak internals
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
    };
  }
}
