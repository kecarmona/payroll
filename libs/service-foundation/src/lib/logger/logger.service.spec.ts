import { LoggerService } from './logger.service';

describe('LoggerService', () => {
  let stdoutSpy: jest.SpyInstance;
  let stderrSpy: jest.SpyInstance;

  beforeEach(() => {
    stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    stderrSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('log()', () => {
    it('should output JSON with message, serviceName, level, correlationId, and context', () => {
      const logger = new LoggerService('auth-service');
      logger.log('User created', 'UserService');

      expect(stdoutSpy).toHaveBeenCalledTimes(1);
      const output = JSON.parse(stdoutSpy.mock.calls[0][0]);
      expect(output).toMatchObject({
        message: 'User created',
        serviceName: 'auth-service',
        level: 'log',
        context: 'UserService',
        correlationId: '-',
      });
      expect(output.timestamp).toBeDefined();
      expect(typeof output.timestamp).toBe('string');
    });

    it('should omit context when not provided', () => {
      const logger = new LoggerService('auth-service');
      logger.log('Simple message');

      const output = JSON.parse(stdoutSpy.mock.calls[0][0]);
      expect(output.message).toBe('Simple message');
      expect(output.context).toBeUndefined();
    });

    it('should use "-" as correlationId when running outside request context', () => {
      const logger = new LoggerService('auth-service');
      logger.log('test');

      const output = JSON.parse(stdoutSpy.mock.calls[0][0]);
      expect(output.correlationId).toBe('-');
    });
  });

  describe('warn()', () => {
    it('should output JSON with level "warn"', () => {
      const logger = new LoggerService('auth-service');
      logger.warn('Degraded performance');

      const output = JSON.parse(stdoutSpy.mock.calls[0][0]);
      expect(output).toMatchObject({
        message: 'Degraded performance',
        level: 'warn',
        serviceName: 'auth-service',
        correlationId: '-',
      });
    });
  });

  describe('error()', () => {
    it('should output to stderr with level "error"', () => {
      const logger = new LoggerService('auth-service');
      logger.error('Operation failed');

      expect(stderrSpy).toHaveBeenCalledTimes(1);
      const output = JSON.parse(stderrSpy.mock.calls[0][0]);
      expect(output).toMatchObject({
        message: 'Operation failed',
        level: 'error',
        serviceName: 'auth-service',
      });
    });

    it('should include stack trace when provided', () => {
      const logger = new LoggerService('auth-service');
      const error = new Error('Something broke');
      logger.error('Operation failed', error.stack, 'TestService');

      const output = JSON.parse(stderrSpy.mock.calls[0][0]);
      expect(output.stack).toBeDefined();
      expect(output.stack).toContain('Error: Something broke');
      expect(output.context).toBe('TestService');
    });
  });

  describe('constructor', () => {
    it('should throw if serviceName is empty', () => {
      expect(() => new LoggerService('')).toThrow('serviceName is required');
    });
  });
});
