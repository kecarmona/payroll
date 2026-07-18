import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { envValidationSchema } from './env.validation';

/**
 * Options for customizing the ConfigModule behaviour.
 */
export interface ConfigModuleOptions {
  /** Custom path(s) to .env file(s) to load. */
  envFilePath?: string | string[];
}

/**
 * Module that loads and validates environment variables using
 * `@nestjs/config` with Joi schema validation.
 *
 * Fails fast on startup when required variables are missing or invalid.
 * Configured as a global module so services throughout the application
 * can inject `ConfigService` without re-importing.
 *
 * @example
 * ```typescript
 * import { ConfigModule } from '@payroll/service-foundation';
 *
 * @Module({
 *   imports: [ConfigModule.forRoot()],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class ConfigModule {
  static forRoot(options?: ConfigModuleOptions): DynamicModule {
    return {
      module: ConfigModule,
      imports: [
        NestConfigModule.forRoot({
          envFilePath: options?.envFilePath,
          validationSchema: envValidationSchema,
          validationOptions: {
            allowUnknown: true,
            abortEarly: true,
          },
          isGlobal: true,
        }),
      ],
    };
  }
}
