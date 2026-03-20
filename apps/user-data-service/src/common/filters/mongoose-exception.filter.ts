import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

import { capitalizeFirstLetter } from '@repo/nestjs-common';

import { Request, Response } from 'express';
import { MongoServerError } from 'mongodb';
import { Error as MongooseError } from 'mongoose';

type MongooseException =
  | MongoServerError
  | MongooseError.CastError
  | MongooseError.DocumentNotFoundError;

interface MongoErrorContext {
  statusCode: HttpStatus;
  error: string;
  clientMessage: string;
  auditMessage: string;
}

@Catch(MongoServerError, MongooseError.CastError, MongooseError.DocumentNotFoundError)
export class MongooseExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(MongooseExceptionFilter.name);

  catch(exception: MongooseException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorContext = this.getErrorContext(exception);

    if (!errorContext) {
      this.handleUnknownError(exception, request);
      return;
    }

    this.logger.error(
      `MongoDB Error at ${request.method} ${request.path}: ${errorContext.auditMessage}`,
      exception.stack,
    );

    response.status(errorContext.statusCode).json({
      statusCode: errorContext.statusCode,
      message: errorContext.clientMessage,
      error: errorContext.error,
      timestamp: new Date().toISOString(),
    });
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private getErrorContext(exception: MongooseException): MongoErrorContext | null {
    if (exception instanceof MongoServerError && exception.code === 11000) {
      return this.handleDuplicateKeyError(exception);
    }

    if (exception instanceof MongooseError.CastError) {
      return this.handleCastError(exception);
    }

    if (exception instanceof MongooseError.DocumentNotFoundError) {
      return this.handleDocumentNotFoundError();
    }

    return null;
  }

  // MongoDB duplicate key error (code 11000) — equivalent to Prisma P2002
  private handleDuplicateKeyError(exception: MongoServerError): MongoErrorContext {
    const keyPattern = exception.keyPattern as Record<string, unknown> | undefined;
    const fields = keyPattern ? Object.keys(keyPattern) : [];
    const fieldList = fields.join(', ');

    const clientMessage = fields.length
      ? `${capitalizeFirstLetter(fieldList)} already exists.`
      : 'Record already exists.';

    const auditMessage = fields.length
      ? `Duplicate key on field(s): ${fieldList}`
      : 'Duplicate key error';

    return {
      statusCode: HttpStatus.CONFLICT,
      error: 'Conflict',
      clientMessage,
      auditMessage,
    };
  }

  // Mongoose CastError — invalid type coercion (e.g. non-ObjectId passed to an ObjectId field)
  private handleCastError(exception: MongooseError.CastError): MongoErrorContext {
    return {
      statusCode: HttpStatus.BAD_REQUEST,
      error: 'Bad Request',
      clientMessage: `Invalid value provided for field '${exception.path}'.`,
      auditMessage: `CastError: invalid ${exception.kind} for path '${exception.path}'`,
    };
  }

  // Mongoose DocumentNotFoundError — thrown when using .orFail() and no document matches the query
  // Equivalent to Prisma P2025
  private handleDocumentNotFoundError(): MongoErrorContext {
    return {
      statusCode: HttpStatus.NOT_FOUND,
      error: 'Not Found',
      clientMessage: 'The requested resource was not found.',
      auditMessage: 'DocumentNotFoundError: query matched no documents',
    };
  }

  private handleUnknownError(exception: MongooseException, request: Request) {
    this.logger.error(
      `Unhandled MongoDB error at ${request.method} ${request.path}: ${exception.message}`,
      exception.stack,
    );
    throw new InternalServerErrorException('Database operation failed', { cause: exception });
  }
}
