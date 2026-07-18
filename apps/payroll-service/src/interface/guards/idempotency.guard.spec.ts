import { createHash } from 'crypto';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { IdempotencyGuard } from './idempotency.guard';
import type { IdempotencyStore } from '../../domain/idempotency-store';

describe('IdempotencyGuard', () => {
  let guard: IdempotencyGuard;
  let mockStore: jest.Mocked<IdempotencyStore>;

  beforeEach(() => {
    mockStore = {
      findByKey: jest.fn(),
      save: jest.fn(),
    } as jest.Mocked<IdempotencyStore>;

    guard = new IdempotencyGuard(mockStore);
  });

  /** Builds a mock execution context with the given headers and body. */
  function createContext(
    headers: Record<string, string | undefined>,
    body: unknown = {},
  ) {
    const request = { headers, body } as Record<string, unknown>;
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as Parameters<IdempotencyGuard['canActivate']>[0];
  }

  describe('missing header', () => {
    it('should throw BadRequestException when Idempotency-Key header is missing', async () => {
      const context = createContext({});

      await expect(guard.canActivate(context)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when Idempotency-Key is undefined', async () => {
      const context = createContext({ 'idempotency-key': undefined });

      await expect(guard.canActivate(context)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('existing key — cache hit', () => {
    it('should return cached response when key exists with matching hash', async () => {
      const body = { companyId: 'c-1', periodId: 'p-1' };
      const expectedHash = createHash('sha256')
        .update(JSON.stringify(body))
        .digest('hex');
      const context = createContext({ 'idempotency-key': 'key-123' }, body);

      mockStore.findByKey.mockResolvedValue({
        key: 'key-123',
        requestHash: expectedHash,
        responseStatus: 201,
        responseBody: { jobId: 'j-123', status: 'CREATED' },
        createdAt: new Date(),
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(false);
      const response = context.switchToHttp().getResponse();
      expect(response.status).toHaveBeenCalledWith(201);
      expect(response.json).toHaveBeenCalledWith({
        jobId: 'j-123',
        status: 'CREATED',
      });
    });
  });

  describe('existing key — hash mismatch', () => {
    it('should throw ConflictException when key exists with different hash', async () => {
      const body = { companyId: 'c-2', periodId: 'p-2' };
      const context = createContext({ 'idempotency-key': 'key-123' }, body);

      // Stored record has a hash for a different request body
      mockStore.findByKey.mockResolvedValue({
        key: 'key-123',
        requestHash: 'different-hash-value',
        responseStatus: 201,
        responseBody: { jobId: 'j-999', status: 'CREATED' },
        createdAt: new Date(),
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('new key', () => {
    it('should allow the request through and attach idempotencyInfo', async () => {
      const body = { companyId: 'c-1', periodId: 'p-1' };
      const context = createContext({ 'idempotency-key': 'new-key-456' }, body);

      mockStore.findByKey.mockResolvedValue(null);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      const request = context.switchToHttp().getRequest() as Record<string, unknown>;
      expect(request.idempotencyInfo).toBeDefined();
      expect((request.idempotencyInfo as Record<string, unknown>).key).toBe('new-key-456');
      expect((request.idempotencyInfo as Record<string, unknown>).requestHash).toBeDefined();
    });
  });
});
