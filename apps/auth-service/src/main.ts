import 'reflect-metadata';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

/**
 * Bootstrap the Auth Service with OpenAPI/Swagger documentation.
 *
 * The Swagger UI is available at `/api-docs` in non-production environments
 * and provides interactive API exploration for all auth endpoints.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Security middleware
  app.use(helmet());
  app.set('trust proxy', 1);

  // Global validation pipe — strips unknown fields, rejects forbidden ones,
  // and auto-transforms payloads to DTO instances
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ── OpenAPI / Swagger setup ──────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('Payroll — Auth Service')
    .setDescription(
      'Authentication and authorization API for the Distributed Payroll Processing Engine.\n\n' +
      'Provides user registration, JWT-based authentication, refresh token rotation, ' +
      'and role-based access control (ADMIN, HR, EMPLOYEE).',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT access token (without "Bearer " prefix)',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  // ── Server ────────────────────────────────────────────────────
  const port = Number(process.env.AUTH_SERVICE_PORT ?? 3001);
  await app.listen(port);
  console.log(`Auth service running on http://localhost:${port}`);
  console.log(`Swagger UI: http://localhost:${port}/api-docs`);
}

void bootstrap();
