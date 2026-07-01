import { HttpStatus, InternalServerErrorException } from '@nestjs/common';

import { AuditLogEventType, AuditLogSeverity } from '@repo/db';
import { AuditLogProvider } from '@repo/nestjs-common';

import { MongoServerError } from 'mongodb';
import { Error as MongooseError } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MongooseExceptionFilter } from './mongoose-exception.filter';

function createDuplicateKeyError(
  fields: string[],
  values?: Record<string, unknown>,
): MongoServerError {
  const keyPattern = Object.fromEntries(fields.map((f) => [f, 1]));
  const keyValue = values ?? Object.fromEntries(fields.map((f) => [f, 'some-value']));
  const error = new MongoServerError({
    message: `E11000 duplicate key error collection: db.preferences index: ${fields[0]}_1 dup key`,
  });
  Object.assign(error, { code: 11000, keyPattern, keyValue });
  return error;
}

function createCastError(path: string, kind: string, value: unknown): MongooseError.CastError {
  const error = new MongooseError.CastError(kind, value, path);
  return error;
}

function createDocumentNotFoundError(): MongooseError.DocumentNotFoundError {
  return new MongooseError.DocumentNotFoundError('No document found for query');
}

function createMockHost() {
  const mockJson = vi.fn();
  const mockStatus = vi.fn().mockReturnValue({ json: mockJson });
  const mockResponse = { status: mockStatus };
  const mockRequest = { url: '/test', method: 'GET', path: '/test' };

  const host = {
    switchToHttp: vi.fn().mockReturnValue({
      getResponse: vi.fn().mockReturnValue(mockResponse),
      getRequest: vi.fn().mockReturnValue(mockRequest),
    }),
  };

  return { host, mockStatus, mockJson, mockRequest };
}

describe('MongooseExceptionFilter', () => {
  let filter: MongooseExceptionFilter;
  let errorLogSpy: ReturnType<typeof vi.spyOn>;
  const mockAuditLogProvider = { auditRequest: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    filter = new MongooseExceptionFilter(mockAuditLogProvider as unknown as AuditLogProvider);
    errorLogSpy = vi.spyOn(filter['logger'], 'error').mockImplementation(() => {});
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  describe('MongoServerError - duplicate key (code 11000)', () => {
    it('should respond 409 Conflict', () => {
      const { host, mockStatus, mockJson } = createMockHost();
      const exception = createDuplicateKeyError(['userId']);

      filter.catch(exception, host as never);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.CONFLICT,
          error: 'Conflict',
        }),
      );
    });

    it('should include the field name (capitalised) in the client message', () => {
      const { host, mockJson } = createMockHost();
      const exception = createDuplicateKeyError(['userId']);

      filter.catch(exception, host as never);

      // capitalizeFirstLetter('userId') → 'UserId'
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('UserId') as string,
        }),
      );
    });

    it('should fall back gracefully when keyPattern is absent', () => {
      const { host, mockStatus, mockJson } = createMockHost();
      const exception = new MongoServerError({ message: 'E11000 duplicate key error' });
      Object.assign(exception, { code: 11000 });

      filter.catch(exception, host as never);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Record already exists.' }),
      );
    });

    it('should log an error', () => {
      const { host } = createMockHost();
      const exception = createDuplicateKeyError(['userId']);

      filter.catch(exception, host as never);

      expect(errorLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Duplicate key') as string,
        exception.stack,
      );
    });

    it('should include a timestamp in the response', () => {
      const { host, mockJson } = createMockHost();
      const exception = createDuplicateKeyError(['userId']);

      filter.catch(exception, host as never);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({ timestamp: expect.any(String) as string }),
      );
    });
  });

  describe('MongooseError.CastError', () => {
    it('should respond 400 Bad Request', () => {
      const { host, mockStatus, mockJson } = createMockHost();
      const exception = createCastError('userId', 'ObjectId', 'not-a-valid-id');

      filter.catch(exception, host as never);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          error: 'Bad Request',
        }),
      );
    });

    it('should include the field path in the client message', () => {
      const { host, mockJson } = createMockHost();
      const exception = createCastError('userId', 'ObjectId', 'not-a-valid-id');

      filter.catch(exception, host as never);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('userId') as string,
        }),
      );
    });

    it('should log an error with CastError details', () => {
      const { host } = createMockHost();
      const exception = createCastError('userId', 'ObjectId', 'not-a-valid-id');

      filter.catch(exception, host as never);

      expect(errorLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('CastError') as string,
        exception.stack,
      );
    });
  });

  describe('MongooseError.DocumentNotFoundError', () => {
    it('should respond 404 Not Found', () => {
      const { host, mockStatus, mockJson } = createMockHost();
      const exception = createDocumentNotFoundError();

      filter.catch(exception, host as never);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.NOT_FOUND,
          error: 'Not Found',
        }),
      );
    });

    it('should log an error', () => {
      const { host } = createMockHost();
      const exception = createDocumentNotFoundError();

      filter.catch(exception, host as never);

      expect(errorLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('DocumentNotFoundError') as string,
        exception.stack,
      );
    });
  });

  describe('audit logging', () => {
    it('should emit an audit event for a duplicate key error', () => {
      const { host, mockRequest } = createMockHost();
      const exception = createDuplicateKeyError(['userId']);

      filter.catch(exception, host as never);

      expect(mockAuditLogProvider.auditRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: AuditLogEventType.CONFLICT_ERROR,
          severity: AuditLogSeverity.WARN,
          statusCode: HttpStatus.CONFLICT,
        }),
        mockRequest,
      );
    });

    it('should emit an audit event for a CastError', () => {
      const { host, mockRequest } = createMockHost();
      const exception = createCastError('userId', 'ObjectId', 'not-a-valid-id');

      filter.catch(exception, host as never);

      expect(mockAuditLogProvider.auditRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: AuditLogEventType.VALIDATION_ERROR,
          severity: AuditLogSeverity.INFO,
          statusCode: HttpStatus.BAD_REQUEST,
        }),
        mockRequest,
      );
    });

    it('should emit an audit event for a DocumentNotFoundError', () => {
      const { host, mockRequest } = createMockHost();
      const exception = createDocumentNotFoundError();

      filter.catch(exception, host as never);

      expect(mockAuditLogProvider.auditRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: AuditLogEventType.RESOURCE_NOT_FOUND,
          severity: AuditLogSeverity.WARN,
          statusCode: HttpStatus.NOT_FOUND,
        }),
        mockRequest,
      );
    });

    it('should NOT emit an audit event for unknown MongoServerError codes', () => {
      const { host } = createMockHost();
      const exception = new MongoServerError({ message: 'Some other server error' });
      Object.assign(exception, { code: 99999 });

      expect(() => filter.catch(exception, host as never)).toThrow(InternalServerErrorException);
      expect(mockAuditLogProvider.auditRequest).not.toHaveBeenCalled();
    });
  });

  describe('unhandled MongoDB errors', () => {
    it('should throw InternalServerErrorException for unknown MongoServerError codes', () => {
      const { host } = createMockHost();
      const exception = new MongoServerError({ message: 'Some other server error' });
      Object.assign(exception, { code: 99999 });

      expect(() => filter.catch(exception, host as never)).toThrow(InternalServerErrorException);
    });

    it('should log an error before throwing for unknown errors', () => {
      const { host } = createMockHost();
      const exception = new MongoServerError({ message: 'Some other server error' });
      Object.assign(exception, { code: 99999 });

      try {
        filter.catch(exception, host as never);
      } catch {
        // expected
      }

      expect(errorLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unhandled MongoDB error') as string,
        exception.stack,
      );
    });
  });
});
