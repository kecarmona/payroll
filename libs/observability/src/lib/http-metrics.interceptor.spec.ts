import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { Response } from 'express';
import { HttpMetricsInterceptor } from './http-metrics.interceptor';
import { MetricsService } from './metrics.service';

/* eslint-disable @typescript-eslint/no-explicit-any */

describe('HttpMetricsInterceptor', () => {
  let interceptor: HttpMetricsInterceptor;
  let metricsService: jest.Mocked<MetricsService>;
  let mockContext: ExecutionContext;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    // Clear any previous prometheus registry state
    const { register } = jest.requireActual('prom-client');
    register.clear();

    metricsService = {
      incrementHttpRequest: jest.fn(),
      observeHttpDuration: jest.fn(),
      incrementKafkaMessage: jest.fn(),
      observeKafkaProcessingDuration: jest.fn(),
      setOutboxPendingCount: jest.fn(),
      incrementOutboxPublishFailures: jest.fn(),
      getMetrics: jest.fn(),
    } as unknown as jest.Mocked<MetricsService>;

    interceptor = new HttpMetricsInterceptor(metricsService);

    mockResponse = {
      statusCode: 200,
    };

    mockContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          method: 'GET',
          route: { path: '/api/test' },
          path: '/api/test',
        }),
        getResponse: jest.fn().mockReturnValue(mockResponse),
      }),
    } as unknown as ExecutionContext;
  });

  describe('intercept', () => {
    it('should record metrics on successful response', (done) => {
      const next: CallHandler = {
        handle: jest.fn().mockReturnValue(of({ data: 'ok' })),
      };

      interceptor.intercept(mockContext, next).subscribe({
        next: () => {
          // Metrics should have been recorded
          expect(metricsService.incrementHttpRequest).toHaveBeenCalledWith(
            'GET',
            '/api/test',
            '200',
          );
          expect(metricsService.observeHttpDuration).toHaveBeenCalledWith(
            'GET',
            '/api/test',
            '200',
            expect.any(Number),
          );
          done();
        },
      });
    });

    it('should record metrics on error response', (done) => {
      mockResponse.statusCode = 500;

      const next: CallHandler = {
        handle: jest
          .fn()
          .mockReturnValue(throwError(() => new Error('Internal error'))),
      };

      interceptor.intercept(mockContext, next).subscribe({
        error: () => {
          // Metrics should still be recorded even on error
          expect(metricsService.incrementHttpRequest).toHaveBeenCalledWith(
            'GET',
            '/api/test',
            '500',
          );
          done();
        },
      });
    });

    it('should capture the correct method and path from the request', (done) => {
      const customContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            method: 'POST',
            route: { path: '/api/employees' },
            path: '/api/employees',
          }),
          getResponse: jest.fn().mockReturnValue({ statusCode: 201 }),
        }),
      } as unknown as ExecutionContext;

      const next: CallHandler = {
        handle: jest.fn().mockReturnValue(of({ id: '123' })),
      };

      interceptor.intercept(customContext, next).subscribe({
        next: () => {
          expect(metricsService.incrementHttpRequest).toHaveBeenCalledWith(
            'POST',
            '/api/employees',
            '201',
          );
          done();
        },
      });
    });

    it('should fall back to request.path when route.path is undefined', (done) => {
      const contextNoRoute = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            method: 'GET',
            route: undefined,
            path: '/fallback/path',
          }),
          getResponse: jest.fn().mockReturnValue({ statusCode: 200 }),
        }),
      } as unknown as ExecutionContext;

      const next: CallHandler = {
        handle: jest.fn().mockReturnValue(of({})),
      };

      interceptor.intercept(contextNoRoute, next).subscribe({
        next: () => {
          expect(metricsService.incrementHttpRequest).toHaveBeenCalledWith(
            'GET',
            '/fallback/path',
            '200',
          );
          done();
        },
      });
    });

    it('should record the duration as a positive number', (done) => {
      const next: CallHandler = {
        handle: jest.fn().mockReturnValue(of({})),
      };

      interceptor.intercept(mockContext, next).subscribe({
        next: () => {
          const duration = metricsService.observeHttpDuration.mock.calls[0][3];
          expect(typeof duration).toBe('number');
          expect(duration).toBeGreaterThanOrEqual(0);
          done();
        },
      });
    });
  });
});
