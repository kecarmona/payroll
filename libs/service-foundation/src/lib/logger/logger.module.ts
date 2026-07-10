import { DynamicModule, Module } from '@nestjs/common';
import { LoggerService } from './logger.service';

/**
 * Options for configuring the LoggerModule.
 */
export interface LoggerModuleOptions {
  /** The name of the service using this logger (e.g., "auth-service"). */
  serviceName: string;
}

/**
 * Module that provides a structured JSON LoggerService configured with
 * the given service name.
 *
 * @example
 * ```typescript
 * import { LoggerModule } from '@payroll/service-foundation';
 *
 * @Module({
 *   imports: [LoggerModule.forRoot({ serviceName: 'auth-service' })],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class LoggerModule {
  static forRoot(options: LoggerModuleOptions): DynamicModule {
    return {
      module: LoggerModule,
      providers: [
        {
          provide: LoggerService,
          useValue: new LoggerService(options.serviceName),
        },
      ],
      exports: [LoggerService],
    };
  }
}
