import { Catch, HttpStatus } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';

import { AuditEventType } from '@repo/db';
import {
  BaseGlobalExceptionsFilter,
  BffAuthenticationException,
  safeCaptureSentryException,
  safeStringify,
} from '@repo/nestjs-common';

import { Request } from 'express';

@Catch()
export class GlobalExceptionsFilter extends BaseGlobalExceptionsFilter {
  constructor() {
    super(GlobalExceptionsFilter.name);
  }

  protected handleException(
    exception: unknown,
    request: Request,
    status: HttpStatus,
    errorCode: string,
  ): void {
    const { path, method } = request;

    if (exception instanceof ThrottlerException) {
      this.logger.warn(`Rate limit exceeded at ${method} ${path}`);
      return;
    }

    if (exception instanceof BffAuthenticationException) {
      this.logger.warn(`BFF authentication exception at ${method} ${path}`);

      safeCaptureSentryException(
        { exception, request, errorCode, eventType: AuditEventType.BFF_SECRET_MISMATCH },
        this.logger,
      );
      return;
    }

    if (this.isServerError(status)) {
      const message = exception instanceof Error ? exception.message : 'Unknown error';
      const stack = exception instanceof Error ? exception.stack : safeStringify(exception);

      this.logger.error(`Unhandled ${status} at ${method} ${path}: ${message}`, stack);

      safeCaptureSentryException(
        { exception, request, errorCode, eventType: AuditEventType.INTERNAL_SERVER_ERROR },
        this.logger,
      );
      return;
    }

    if (status === HttpStatus.UNAUTHORIZED) {
      this.logger.warn(`Unauthorized at ${method} ${path}`);
      return;
    }

    if (status === HttpStatus.FORBIDDEN) {
      this.logger.warn(`Forbidden at ${method} ${path}`);
      return;
    }

    if (status === HttpStatus.NOT_FOUND) {
      return; // not worth logging noise
    }

    if (this.isClientError(status) && !this.isValidationError(exception)) {
      this.logger.warn(`Unexpected client error ${status} at ${method} ${path}`);
    }
  }
}
