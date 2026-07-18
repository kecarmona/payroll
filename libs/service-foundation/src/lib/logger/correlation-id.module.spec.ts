import { Test, TestingModule } from '@nestjs/testing';
import { CorrelationIdModule } from './correlation-id.module';
import { CorrelationIdMiddleware } from './correlation-id.middleware';

describe('CorrelationIdModule', () => {
  it('should create a module that can be imported and compiled', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CorrelationIdModule.forRoot()],
    }).compile();

    expect(module).toBeDefined();
  });

  it('should provide CorrelationIdMiddleware for injection', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CorrelationIdModule.forRoot()],
    }).compile();

    const middleware = module.get<CorrelationIdMiddleware>(CorrelationIdMiddleware);
    expect(middleware).toBeDefined();
    expect(middleware).toBeInstanceOf(CorrelationIdMiddleware);
  });

  it('should allow services to use getCorrelationId() static accessor', () => {
    // The static method should be available on the class
    expect(typeof CorrelationIdMiddleware.getCorrelationId).toBe('function');
  });
});
