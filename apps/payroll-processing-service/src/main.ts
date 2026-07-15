import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

/**
 * Bootstraps the Payroll Processing Service HTTP server.
 *
 * Configures global validation and listens on the port specified by
 * `PAYROLL_PROCESSING_SERVICE_PORT` (default: 3004).
 *
 * The Kafka consumer is started automatically by the {@link KafkaConsumerService}
 * registered in {@link AppModule}.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = Number(process.env.PAYROLL_PROCESSING_SERVICE_PORT ?? 3004);
  await app.listen(port);
}

void bootstrap();
