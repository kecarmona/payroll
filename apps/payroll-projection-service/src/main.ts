import 'reflect-metadata';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

/**
 * Bootstraps the Payroll Projection Service HTTP server.
 *
 * Configures:
 * - Global validation with whitelist, forbidNonWhitelisted, and transform
 * - Swagger/OpenAPI documentation at `/api/docs`
 *
 * Listens on the port specified by `PAYROLL_PROJECTION_SERVICE_PORT` (default: 3005).
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

  // ── Swagger / OpenAPI documentation ────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('Payroll Projection Service')
    .setDescription('MongoDB-based CQRS projection query API for the Distributed Payroll Engine')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env.PAYROLL_PROJECTION_SERVICE_PORT ?? 3005);
  await app.listen(port);
}

void bootstrap();
