import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionalOutboxModule, OUTBOX_STORE_TOKEN } from './transactional-outbox.module';

describe('TransactionalOutboxModule', () => {
  it('should create a dynamic module with forRoot', () => {
    const dynamicModule = TransactionalOutboxModule.forRoot();

    expect(dynamicModule).toBeDefined();
    expect(dynamicModule.module).toBe(TransactionalOutboxModule);
    expect(dynamicModule.providers).toBeDefined();
    expect(dynamicModule.exports).toBeDefined();
  });

  it('should provide the OUTBOX_STORE_TOKEN in the dynamic module', () => {
    const dynamicModule = TransactionalOutboxModule.forRoot();

    const providerTokens = dynamicModule.providers?.map((p) =>
      typeof p === 'object' && p !== null && 'provide' in p
        ? (p as { provide: unknown }).provide
        : p,
    );

    expect(providerTokens).toContain(OUTBOX_STORE_TOKEN);
  });

  it('should export TypeOrmModule for entity registration in consumers', () => {
    const dynamicModule = TransactionalOutboxModule.forRoot();

    expect(dynamicModule.exports).toContain(TypeOrmModule);
  });

  it('should include TypeOrmModule.forFeature import in the dynamic module', () => {
    const dynamicModule = TransactionalOutboxModule.forRoot();

    expect(dynamicModule.imports).toBeDefined();
    expect(dynamicModule.imports!.length).toBeGreaterThan(0);
  });
});
