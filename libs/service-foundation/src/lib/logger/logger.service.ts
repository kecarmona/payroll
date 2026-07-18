import { LoggerService as NestLoggerService } from '@nestjs/common';
import { CorrelationIdMiddleware } from './correlation-id.middleware';

/**
 * @ignore
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LogEntry = Record<string, any>;

/**
 * Structured JSON logger that includes correlation ID and service name context.
 *
 * Wraps NestJS Logger behavior but outputs JSON-structured entries with
 * `timestamp`, `level`, `message`, `correlationId`, `serviceName`, and `context`.
 *
 * @example
 * ```typescript
 * const logger = new LoggerService('auth-service');
 * logger.log('User created', 'UserService');
 * // Output: {"timestamp":"2026-...","level":"log","message":"User created","correlationId":"-","serviceName":"auth-service","context":"UserService"}
 * ```
 */
export class LoggerService implements NestLoggerService {
  private readonly serviceName: string;

  constructor(serviceName: string) {
    if (!serviceName) {
      throw new Error('serviceName is required for LoggerService');
    }
    this.serviceName = serviceName;
  }

  /**
   * Writes a structured JSON log entry at the "log" level.
   *
   * @param message - The log message.
   * @param context - Optional context (e.g., class name where the log was called).
   */
  log(message: string, context?: string): void {
    this.writeEntry('log', message, context);
  }

  /**
   * Writes a structured JSON log entry at the "warn" level.
   *
   * @param message - The log message.
   * @param context - Optional context (e.g., class name where the log was called).
   */
  warn(message: string, context?: string): void {
    this.writeEntry('warn', message, context);
  }

  /**
   * Writes a structured JSON log entry at the "error" level.
   *
   * @param message - The log message.
   * @param stack - Optional error stack trace.
   * @param context - Optional context (e.g., class name where the log was called).
   */
  error(message: string, stack?: string, context?: string): void {
    const entry = this.buildEntry('error', message, context);
    if (stack) {
      entry.stack = stack;
    }
    process.stderr.write(JSON.stringify(entry) + '\n');
  }

  private writeEntry(level: string, message: string, context?: string): void {
    const entry = this.buildEntry(level, message, context);
    process.stdout.write(JSON.stringify(entry) + '\n');
  }

  private buildEntry(level: string, message: string, context?: string): LogEntry {
    const correlationId =
      CorrelationIdMiddleware.getCorrelationId() ?? '-';

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      correlationId,
      serviceName: this.serviceName,
    };

    if (context) {
      entry.context = context;
    }

    return entry;
  }
}
