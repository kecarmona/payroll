import { Module } from '@nestjs/common';
import { ProjectionMongooseModule } from '../infrastructure/mongoose/projection-mongoose.module';
import { ProjectionModule } from '../application/projection.module';
import { JobsController } from './controllers/jobs.controller';
import { TransactionsController } from './controllers/transactions.controller';
import { PayslipsController } from './controllers/payslips.controller';
import { ProjectionConsumerService } from './kafka/projection-consumer.service';

/**
 * NestJS module that wires the interface layer of the projection service.
 *
 * Registers:
 * - REST controllers for querying projections
 * - Kafka consumer service for processing inbound events
 *
 * Depends on {@link ProjectionMongooseModule} for model access and
 * {@link ProjectionModule} for handler registration.
 */
@Module({
  imports: [ProjectionMongooseModule, ProjectionModule],
  controllers: [JobsController, TransactionsController, PayslipsController],
  providers: [ProjectionConsumerService],
  exports: [ProjectionConsumerService],
})
export class InterfaceModule {}
