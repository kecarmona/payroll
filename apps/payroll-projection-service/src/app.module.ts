import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthGuardsModule } from '@payroll/auth-guards';
import { ObservabilityModule, MetricsController } from '@payroll/observability';
import type { EventDeserializer } from '@payroll/event-bus';
import { HealthController } from './health.controller';
import { ProjectionModule } from './application/projection.module';
import { ProjectionMongooseModule } from './infrastructure/mongoose/projection-mongoose.module';
import { InterfaceModule } from './interface/interface.module';
import { ProjectionConsumerService } from './interface/kafka/projection-consumer.service';
import { ProjectionKafkaConsumerService } from './interface/kafka/projection-kafka-consumer.service';

/**
 * Root application module for the Payroll Projection Service.
 *
 * Configures:
 * - Environment variable loading via `@nestjs/config`
 * - Mongoose connection to MongoDB (projection database)
 * - Projection domain infrastructure (Mongoose schemas, models)
 * - Application layer (idempotency, handlers)
 * - Interface layer (REST controllers, event consumer)
 *
 * The {@link ProjectionConsumerService} consumes inbound payroll events
 * and routes them to the appropriate projection handler.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }]),
    MongooseModule.forRoot(
      process.env.MONGODB_URI ?? 'mongodb://localhost:27017/payroll_projections',
    ),
    AuthGuardsModule,
    ProjectionMongooseModule,
    ProjectionModule,
    InterfaceModule,
    ObservabilityModule,
  ],
  controllers: [HealthController, MetricsController],
  providers: [
    ProjectionKafkaConsumerService,
    {
      provide: 'EventDeserializer',
      useFactory: (): EventDeserializer => ({
        deserialize: <T>(data: Buffer) => JSON.parse(data.toString()) as T,
      }),
    },
  ],
})
export class AppModule {}
