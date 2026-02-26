import type { ArgumentsHost } from '@nestjs/common';
import {
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';

import { Request, Response } from 'express';

import { safeStringify } from '../utils/safeStringify';

interface HttpExceptionResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
}

interface ThrottlerExceptionWithTracker extends ThrottlerException {
  tracker?: string;
}

@Catch()
export abstract class BaseGlobalExceptionsFilter implements ExceptionFilter {
  protected readonly logger: Logger;

  constructor(loggerName?: string) {
    this.logger = new Logger(loggerName ?? BaseGlobalExceptionsFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const statusCode = this.getStatusCode(exception);
    const exceptionResponse = this.getExceptionResponse(exception);
    const errorCode = this.getErrorCode(exceptionResponse, statusCode);
    const clientMessage = this.extractClientMessage(exception, exceptionResponse);

    this.handleException(exception, request, statusCode, errorCode, clientMessage);

    response.status(statusCode).json({
      statusCode,
      message: clientMessage,
      error: errorCode,
      timestamp: new Date().toISOString(),
    });
  }

  protected abstract handleException(
    exception: unknown,
    request: Request,
    statusCode: HttpStatus,
    errorCode: string,
    clientMessage?: string | string[],
  ): void;

  // ============================================
  // HELPER METHODS
  // ============================================

  protected isServerError(status: HttpStatus): boolean {
    const statusCode = status as number;
    return statusCode >= 500 && statusCode < 600;
  }

  protected isClientError(status: HttpStatus): boolean {
    const statusCode = status as number;
    return statusCode >= 400 && statusCode < 500;
  }

  protected isValidationError(exception: unknown): boolean {
    if (!(exception instanceof BadRequestException)) {
      return false;
    }
    const response = exception.getResponse();
    return (
      typeof response === 'object' &&
      response !== null &&
      'message' in response &&
      Array.isArray(response.message)
    );
  }

  protected isThrottlerExceptionWithTracker(
    exception: unknown,
  ): exception is ThrottlerExceptionWithTracker {
    return exception instanceof ThrottlerException && 'tracker' in exception;
  }

  protected getStatusCode(exception: unknown): HttpStatus {
    return exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
  }

  protected getExceptionResponse(exception: unknown): HttpExceptionResponse | null {
    if (!(exception instanceof HttpException)) {
      return null;
    }

    const response = exception.getResponse();
    const status = exception.getStatus();

    if (typeof response === 'string') {
      return {
        statusCode: status,
        message: response,
      };
    }

    if (this.isObjectWithMessage(response)) {
      return {
        statusCode: status,
        message: response.message,
        ...(this.hasErrorCode(response) && { error: response.error }),
      };
    }

    this.logger.warn(`Unexpected exception response format: ${safeStringify(response)}`);

    return {
      statusCode: status,
      message: 'An error occurred',
    };
  }

  protected isObjectWithMessage(response: unknown): response is { message: string | string[] } {
    return (
      typeof response === 'object' &&
      response !== null &&
      'message' in response &&
      (typeof (response as Record<string, unknown>).message === 'string' ||
        Array.isArray((response as Record<string, unknown>).message))
    );
  }

  protected hasErrorCode(response: {
    message: string | string[];
  }): response is { message: string | string[]; error: string } {
    return 'error' in response && typeof (response as Record<string, unknown>).error === 'string';
  }

  protected getErrorCode(exceptionResponse: HttpExceptionResponse | null, status: number): string {
    if (exceptionResponse?.error) {
      return exceptionResponse.error;
    }
    return this.getDefaultErrorCode(status);
  }

  protected getDefaultErrorCode(status: number): string {
    const errorMap: Record<number, string> = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      409: 'Conflict',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
    };
    return errorMap[status] ?? 'Error';
  }

  protected extractClientMessage(
    exception: unknown,
    exceptionResponse: HttpExceptionResponse | null,
  ): string | string[] {
    if (exceptionResponse?.message) {
      return exceptionResponse.message;
    }

    if (exception instanceof Error) {
      return exception.message;
    }

    return 'An unexpected error occurred';
  }
}
