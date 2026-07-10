import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from './config.module';
import { ConfigService } from '@nestjs/config';

const REQUIRED_ENV_VARS = {
  NODE_ENV: 'test',
  PORT: '3001',
  SERVICE_NAME: 'test-service',
  DATABASE_URL: 'postgresql://localhost:5432/payroll_test',
  REDIS_URL: 'redis://localhost:6379',
  KAFKA_BROKERS: 'localhost:9092',
};

describe('ConfigModule', () => {
  beforeEach(() => {
    // Set required env vars before module creation
    for (const [key, value] of Object.entries(REQUIRED_ENV_VARS)) {
      process.env[key] = value;
    }
  });

  afterEach(() => {
    // Clean up env vars after each test
    for (const key of Object.keys(REQUIRED_ENV_VARS)) {
      delete process.env[key];
    }
  });

  describe('forRoot', () => {
    it('should create a module that compiles successfully', async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [ConfigModule.forRoot()],
      }).compile();

      expect(module).toBeDefined();
    });

    it('should provide ConfigService for injection', async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [ConfigModule.forRoot()],
      }).compile();

      const configService = module.get<ConfigService>(ConfigService);
      expect(configService).toBeDefined();
    });

    it('should expose env vars via ConfigService', async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [ConfigModule.forRoot()],
      }).compile();

      const configService = module.get<ConfigService>(ConfigService);
      expect(configService.get('SERVICE_NAME')).toBe('test-service');
      expect(configService.get('NODE_ENV')).toBe('test');
      expect(configService.get('PORT')).toBe('3001');
    });

    it('should fail to compile when required env var is missing', async () => {
      delete process.env.DATABASE_URL;

      await expect(
        Test.createTestingModule({
          imports: [ConfigModule.forRoot()],
        }).compile(),
      ).rejects.toThrow();
    });
  });
});
