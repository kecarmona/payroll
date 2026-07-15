import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthController } from './health.controller';
import { ProjectionModule } from './application/projection.module';
import { ProjectionMongooseModule } from './infrastructure/mongoose/projection-mongoose.module';
import { InterfaceModule } from './interface/interface.module';
import { ProjectionConsumerService } from './interface/kafka/projection-consumer.service';

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
    MongooseModule.forRoot(
      process.env.MONGODB_URI ?? 'mongodb://localhost:27017/payroll_projections',
    ),
    ProjectionMongooseModule,
    ProjectionModule,
    InterfaceModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule implements OnModuleInit {
  constructor(
    private readonly projectionConsumer: ProjectionConsumerService,
  ) {}

  /**
   * Lifecycle hook that runs after all modules are initialized.
   * Currently used for future Kafka consumer integration.
   */
  async onModuleInit(): Promise<void> {
    // Kafka consumer integration will be added here when the
    // Kafka infrastructure module is available.
  }
}
