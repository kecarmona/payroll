import { CorrelationIdMiddleware, CORRELATION_ID_TOKEN } from './correlation-id.middleware';
import { Request, Response } from 'express';

/* eslint-disable @typescript-eslint/no-explicit-any */

describe('CorrelationIdMiddleware', () => {
  let middleware: CorrelationIdMiddleware;

  beforeEach(() => {
    middleware = new CorrelationIdMiddleware();
  });

  describe('when x-correlation-id header is present', () => {
    it('should store the header value in AsyncLocalStorage', () => {
      const correlationId = 'abc-123';
      const req = { headers: { 'x-correlation-id': correlationId } } as unknown as Request;
      const res = {} as unknown as Response;
      let storedValue: string | undefined;

      const next = () => {
        storedValue = CorrelationIdMiddleware.getCorrelationId();
      };

      middleware.use(req, res, next);

      expect(storedValue).toBe(correlationId);
    });
  });

  describe('when x-correlation-id header is missing', () => {
    it('should generate a UUID v4 and store it', () => {
      const req = { headers: {} } as unknown as Request;
      const res = {} as unknown as Response;
      let storedValue: string | undefined;

      const next = () => {
        storedValue = CorrelationIdMiddleware.getCorrelationId();
      };

      middleware.use(req, res, next);

      expect(storedValue).toBeDefined();
      expect(storedValue?.length).toBeGreaterThan(0);
      expect(storedValue).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });
  });

  describe('getCorrelationId()', () => {
    it('should return undefined when called outside of a request context', () => {
      const result = CorrelationIdMiddleware.getCorrelationId();

      expect(result).toBeUndefined();
    });
  });

  describe('CORRELATION_ID_TOKEN', () => {
    it('should be a Symbol', () => {
      expect(typeof CORRELATION_ID_TOKEN).toBe('symbol');
    });
  });
});

/* eslint-enable @typescript-eslint/no-explicit-any */
