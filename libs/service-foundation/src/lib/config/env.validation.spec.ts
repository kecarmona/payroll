import { validateEnv } from './env.validation';

describe('validateEnv', () => {
  describe('when all required env vars are present and valid', () => {
    const validEnv = {
      NODE_ENV: 'development',
      PORT: '3001',
      SERVICE_NAME: 'auth-service',
      DATABASE_URL: 'postgresql://localhost:5432/payroll',
      REDIS_URL: 'redis://localhost:6379',
      KAFKA_BROKERS: 'localhost:9092',
    };

    it('should return a valid config object', () => {
      const config = validateEnv(validEnv);
      expect(config).toBeDefined();
      expect(config.NODE_ENV).toBe('development');
      expect(config.PORT).toBe('3001');
      expect(config.SERVICE_NAME).toBe('auth-service');
      expect(config.DATABASE_URL).toBe('postgresql://localhost:5432/payroll');
    });

    it('should parse PORT as a string (Joi string validation)', () => {
      const config = validateEnv(validEnv);
      expect(typeof config.PORT).toBe('string');
    });

    it('should accept valid Kafka brokers', () => {
      const config = validateEnv(validEnv);
      expect(config.KAFKA_BROKERS).toBe('localhost:9092');
    });
  });

  describe('when required env vars are missing', () => {
    it('should throw an error when DATABASE_URL is not set', () => {
      const env = {
        NODE_ENV: 'development',
        PORT: '3001',
        SERVICE_NAME: 'auth-service',
        REDIS_URL: 'redis://localhost:6379',
        KAFKA_BROKERS: 'localhost:9092',
      };

      expect(() => validateEnv(env)).toThrow();
    });

    it('should throw an error when SERVICE_NAME is not set', () => {
      const env = {
        NODE_ENV: 'development',
        PORT: '3001',
        DATABASE_URL: 'postgresql://localhost:5432/payroll',
        REDIS_URL: 'redis://localhost:6379',
        KAFKA_BROKERS: 'localhost:9092',
      };

      expect(() => validateEnv(env)).toThrow();
    });

    it('should mention which field is missing in the error message', () => {
      const env = {
        NODE_ENV: 'development',
        PORT: '3001',
        SERVICE_NAME: 'auth-service',
        DATABASE_URL: 'postgresql://localhost:5432/payroll',
        REDIS_URL: 'redis://localhost:6379',
      };

      try {
        validateEnv(env);
        fail('Expected error was not thrown');
      } catch (err: unknown) {
        expect((err as Error).message).toMatch(/KAFKA_BROKERS/i);
      }
    });
  });

  describe('when env vars have invalid values', () => {
    it('should throw for invalid NODE_ENV value', () => {
      const env = {
        NODE_ENV: 'invalid',
        PORT: '3001',
        SERVICE_NAME: 'auth-service',
        DATABASE_URL: 'postgresql://localhost:5432/payroll',
        REDIS_URL: 'redis://localhost:6379',
        KAFKA_BROKERS: 'localhost:9092',
      };

      expect(() => validateEnv(env)).toThrow();
    });

    it('should throw for non-numeric PORT', () => {
      const env = {
        NODE_ENV: 'development',
        PORT: 'not-a-number',
        SERVICE_NAME: 'auth-service',
        DATABASE_URL: 'postgresql://localhost:5432/payroll',
        REDIS_URL: 'redis://localhost:6379',
        KAFKA_BROKERS: 'localhost:9092',
      };

      expect(() => validateEnv(env)).toThrow();
    });
  });
});
