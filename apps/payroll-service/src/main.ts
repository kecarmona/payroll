import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

/**
 * Bootstraps the Payroll Service HTTP server.
 *
 * Configures global validation, Swagger API documentation at `/api`,
 * and listens on the port specified by `PAYROLL_SERVICE_PORT` (default: 3003).
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

  // OpenAPI / Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Payroll Service')
    .setDescription('Payroll job orchestration — periods, jobs, and processing')
    .setVersion('1.0')
    .addTag('Payroll', 'Payroll period and job orchestration endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = Number(process.env.PAYROLL_SERVICE_PORT ?? 3003);
  await app.listen(port);
}

void bootstrap();
