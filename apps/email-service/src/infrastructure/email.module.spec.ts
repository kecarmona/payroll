import { Global, Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';
import {
  EmailModule,
  EMAIL_SENDER_TOKEN,
  EMAIL_DELIVERY_REPOSITORY_TOKEN,
} from './email.module';
import { DevEmailAdapter } from './dev-email-adapter';
import { TypeOrmEmailDeliveryRepository } from './typeorm-email-delivery.repository';
import type { EmailSender } from '../domain/email-sender';

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
    {
      provide: Logger,
      useValue: { log: jest.fn(), warn: jest.fn(), error: jest.fn() },
    },
  ],
  exports: [DataSource, Logger],
})
class GlobalMockDepsModule {}

/**
 * Helper to build a test module with EmailModule.
 */
async function createEmailTestModule(): Promise<TestingModule> {
  return Test.createTestingModule({
    imports: [GlobalMockDepsModule, EmailModule],
  }).compile();
}

describe('EmailModule', () => {
  it('should compile the module', async () => {
    const module = await createEmailTestModule();
    expect(module).toBeDefined();
  });

  it('should provide EmailSender implementation (DevEmailAdapter)', async () => {
    const module = await createEmailTestModule();
    const sender = module.get<EmailSender>(EMAIL_SENDER_TOKEN);
    expect(sender).toBeDefined();
    expect(sender).toBeInstanceOf(DevEmailAdapter);
  });

  it('should provide TypeOrmEmailDeliveryRepository', async () => {
    const module = await createEmailTestModule();
    const repo = module.get(EMAIL_DELIVERY_REPOSITORY_TOKEN);
    expect(repo).toBeDefined();
    expect(repo).toBeInstanceOf(TypeOrmEmailDeliveryRepository);
  });
});
