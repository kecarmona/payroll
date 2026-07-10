import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('check()', () => {
    it('should return status "ok"', () => {
      const result = controller.check();
      expect(result.status).toBe('ok');
    });

    it('should include a timestamp in ISO format', () => {
      const result = controller.check();
      expect(result.timestamp).toBeDefined();
      expect(typeof result.timestamp).toBe('string');
      expect(() => new Date(result.timestamp)).not.toThrow();
    });

    it('should include uptime in seconds', () => {
      const result = controller.check();
      expect(result.uptime).toBeDefined();
      expect(typeof result.uptime).toBe('number');
      expect(result.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should return a response with exactly status, timestamp, and uptime', () => {
      const result = controller.check();
      expect(Object.keys(result).sort()).toEqual([
        'status',
        'timestamp',
        'uptime',
      ]);
    });
  });
});
