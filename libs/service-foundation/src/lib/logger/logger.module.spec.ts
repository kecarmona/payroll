import { Test, TestingModule } from '@nestjs/testing';
import { LoggerModule } from './logger.module';
import { LoggerService } from './logger.service';

describe('LoggerModule', () => {
  it('should create a module when forRoot is called with serviceName', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule.forRoot({ serviceName: 'test-service' })],
    }).compile();

    expect(module).toBeDefined();
  });

  it('should provide LoggerService with the configured serviceName', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule.forRoot({ serviceName: 'auth-service' })],
    }).compile();

    const logger = module.get<LoggerService>(LoggerService);
    expect(logger).toBeDefined();
    expect(logger).toBeInstanceOf(LoggerService);
  });

  it('should throw during forRoot() if serviceName is empty', () => {
    expect(() => LoggerModule.forRoot({ serviceName: '' })).toThrow(
      'serviceName is required',
    );
  });

  it('should provide the same LoggerService instance for injection into multiple consumers', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule.forRoot({ serviceName: 'shared-service' })],
    }).compile();

    const logger1 = module.get<LoggerService>(LoggerService);
    const logger2 = module.get<LoggerService>(LoggerService);

    expect(logger1).toBe(logger2);
  });
});
