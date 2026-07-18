import { Global, Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import {
  NotificationModule,
  PROCESSED_EVENT_STORE_TOKEN,
} from './notification.module';
import { TypeOrmNotificationRequestRepository } from './typeorm-notification-request.repository';
import { TypeOrmProcessedEventRepository } from './typeorm-processed-event.repository';
import type { ProcessedEventStore } from '../domain/processed-event-store';

/**
 * Global module that provides a mock DataSource for the test environment.
 */
@Global()
@Module({
  providers: [
    {
      provide: DataSource,
      useValue: {
        getRepository: jest.fn().mockReturnValue({
          findOne: jest.fn(),
          find: jest.fn(),
          save: jest.fn(),
        }),
        entityMetadatas: [],
        options: { type: 'postgres' },
      },
    },
  ],
  exports: [DataSource],
})
class GlobalMockDataSourceModule {}

/**
 * Helper to build a test module with NotificationModule.
 */
async function createNotificationTestModule(): Promise<TestingModule> {
  return Test.createTestingModule({
    imports: [GlobalMockDataSourceModule, NotificationModule],
  }).compile();
}

describe('NotificationModule', () => {
  it('should compile the module', async () => {
    const module = await createNotificationTestModule();
    expect(module).toBeDefined();
  });

  it('should provide ProcessedEventStore implementation', async () => {
    const module = await createNotificationTestModule();
    const store = module.get<ProcessedEventStore>(PROCESSED_EVENT_STORE_TOKEN);
    expect(store).toBeDefined();
    expect(store).toBeInstanceOf(TypeOrmProcessedEventRepository);
  });

  it('should provide TypeOrmNotificationRequestRepository', async () => {
    const module = await createNotificationTestModule();
    const repo = module.get(TypeOrmNotificationRequestRepository);
    expect(repo).toBeDefined();
    expect(repo).toBeInstanceOf(TypeOrmNotificationRequestRepository);
  });
});
