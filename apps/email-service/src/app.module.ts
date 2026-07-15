import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health.controller';
import { EmailModule } from './infrastructure/email.module';

/**
 * Root application module for the Email Service.
 *
 * Configures:
 * - Environment variable loading via `@nestjs/config`
 * - TypeORM connection to PostgreSQL (email database)
 * - Email domain infrastructure (sender adapter, delivery repository)
 * - HTTP health endpoint
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST ?? 'localhost',
      port: Number(process.env.DATABASE_PORT ?? 5432),
      username: process.env.DATABASE_USER ?? 'payroll',
      password: process.env.DATABASE_PASSWORD ?? 'payroll',
      database: process.env.DATABASE_NAME ?? 'payroll_emails',
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    EmailModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
