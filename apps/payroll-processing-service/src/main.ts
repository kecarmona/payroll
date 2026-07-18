import 'reflect-metadata';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
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
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Security middleware
  app.use(helmet());
  app.set('trust proxy', 1);

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
