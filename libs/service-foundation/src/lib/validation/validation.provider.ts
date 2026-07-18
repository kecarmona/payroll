import { ValidationPipe, ValidationPipeOptions } from '@nestjs/common';

/**
 * Creates a pre-configured ValidationPipe with opinionated defaults:
 *
 * - `whitelist: true` — strips properties that have no decorators
 * - `forbidNonWhitelisted: true` — throws when non-whitelisted properties are present
 * - `transform: true` — auto-transforms payloads to DTO instances
 *
 * @example
 * ```typescript
 * // main.ts
 * import { createValidationPipe } from '@payroll/service-foundation';
 *
 * async function bootstrap() {
 *   const app = await NestFactory.create(AppModule);
 *   app.useGlobalPipes(createValidationPipe());
 *   await app.listen(3000);
 * }
 * ```
 */
export function createValidationPipe(
  options?: ValidationPipeOptions,
): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    ...options,
  });
}
