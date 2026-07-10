import { HttpException, HttpStatus, ArgumentsHost } from '@nestjs/common';
import { ValidationError, NotFoundError } from '@payroll/shared-kernel';
import { GlobalExceptionFilter } from './global-exception.filter';

/* eslint-disable @typescript-eslint/no-explicit-any */

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockGetResponse: jest.Mock;
  let mockHttpArgumentsHost: jest.Mock;
  let mockArgumentsHost: Record<string, any>;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockGetResponse = jest.fn().mockReturnValue({
      status: mockStatus,
      json: mockJson,
    });
    mockHttpArgumentsHost = jest.fn().mockReturnValue({
      getResponse: mockGetResponse,
      getRequest: jest.fn().mockReturnValue({}),
    });
    mockArgumentsHost = {
      switchToHttp: mockHttpArgumentsHost,
      getArgByIndex: jest.fn(),
      getArgs: jest.fn(),
      getType: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Domain ValidationError', () => {
    it('should return 400 status code', () => {
      const error = new ValidationError('email', 'Email is required');

      filter.catch(error, mockArgumentsHost as unknown as ArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    });

    it('should return error response with statusCode, error, message, correlationId, and timestamp', () => {
      const error = new ValidationError('email', 'Email is required');

      filter.catch(error, mockArgumentsHost as unknown as ArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          error: 'ValidationError',
          message: 'Email is required',
          correlationId: expect.any(String),
          timestamp: expect.any(String),
        }),
      );
    });
  });

  describe('Domain NotFoundError', () => {
    it('should return 404 status code', () => {
      const error = new NotFoundError('Employee', 'id-42');

      filter.catch(error, mockArgumentsHost as unknown as ArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    });
  });

  describe('generic Error', () => {
    it('should return 500 status code for unknown errors', () => {
      const error = new Error('Something unexpected happened');

      filter.catch(error, mockArgumentsHost as unknown as ArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    });

    it('should hide internal error details in the message', () => {
      const error = new Error('Internal database connection failed');

      filter.catch(error, mockArgumentsHost as unknown as ArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'An unexpected error occurred',
        }),
      );
    });
  });

  describe('HttpException', () => {
    it('should preserve HttpException status code', () => {
      const error = new HttpException('Forbidden resource', HttpStatus.FORBIDDEN);

      filter.catch(error, mockArgumentsHost as unknown as ArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    });

    it('should return the HttpException message in the response', () => {
      const error = new HttpException('Forbidden resource', HttpStatus.FORBIDDEN);

      filter.catch(error, mockArgumentsHost as unknown as ArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
          error: 'Forbidden resource',
        }),
      );
    });
  });
});

/* eslint-enable @typescript-eslint/no-explicit-any */
