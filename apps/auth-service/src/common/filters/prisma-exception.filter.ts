import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

import { AuditEventType, AuditSeverity, Prisma } from '@prisma-client';
import { Request, Response } from 'express';

import capitalizeFirstLetter from '@/common/utils/capitalizeFirstLetter';
import { AuditLogProvider } from '@/modules/audit-log/audit-log.provider';

export interface PrismaDriverError {
  // P2002 fields
  driverAdapterError?: {
    cause?: {
      constraint?: {
        fields: string[];
      };
    };
  };
  target?: string[];

  // P2025 fields
  modelName?: string;
  model?: string;
  operation?: string;
  relation?: string;
}

interface ErrorContext {
  statusCode: number;
  error: string;
  clientMessage: string;
  auditMessage: string;
  eventType: AuditEventType;
  severity: AuditSeverity;
  metadata?: Prisma.InputJsonValue;
}

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name, { timestamp: true });

  constructor(private readonly auditLogProvider: AuditLogProvider) {}

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorContext = this.getErrorContext(exception);

    if (!errorContext) {
      this.handleUnknownError(exception);
      return;
    }

    this.processError(errorContext, exception, request, response);
  }

  private getErrorContext(exception: Prisma.PrismaClientKnownRequestError): ErrorContext | null {
    switch (exception.code) {
      case 'P2002':
        return this.handleConflictError(exception);
      case 'P2025':
        return this.handleNotFoundError(exception);
      default:
        return null;
    }
  }

  // P2002: Unique constraint violation
  private handleConflictError(exception: Prisma.PrismaClientKnownRequestError): ErrorContext {
    const meta = exception.meta as PrismaDriverError;
    const adapterFields = meta?.driverAdapterError?.cause?.constraint?.fields;
    const standardFields = meta?.target;
    const fields = standardFields || adapterFields || [];

    // Special case: ID collision (System Error)
    if (fields.includes('id')) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'Internal Server Error',
        clientMessage: 'Something went wrong, please try again.',
        auditMessage: 'Data Integrity Error: ID Collision detected',
        eventType: AuditEventType.CONFLICT_ERROR,
        severity: AuditSeverity.ERROR,
        metadata: { fields },
      };
    }

    // Standard case: Duplicate entry (User Error)
    const fieldList = fields.join(', ');
    const userMessage = fields.length
      ? `${capitalizeFirstLetter(fieldList)} already exist${fields.length > 1 ? '' : 's'}.`
      : 'Record already exists.';

    return {
      statusCode: HttpStatus.CONFLICT,
      error: 'Conflict',
      clientMessage: userMessage,
      auditMessage: fields.length ? `Duplicate entry: ${fieldList}` : 'Duplicate entry detected',
      eventType: AuditEventType.CONFLICT_ERROR,
      severity: AuditSeverity.WARN,
      metadata: { fields },
    };
  }

  // P2025: Record not found
  private handleNotFoundError(exception: Prisma.PrismaClientKnownRequestError): ErrorContext {
    const meta = exception.meta as PrismaDriverError;
    const targetModel = meta?.model || meta?.modelName || 'record';
    const operation = meta?.operation;

    const isRelationError = operation?.toLowerCase().includes('nested connect');

    const statusCode = isRelationError ? HttpStatus.BAD_REQUEST : HttpStatus.NOT_FOUND;
    const error = isRelationError ? 'Bad Request' : 'Not Found';

    const auditMessage = isRelationError
      ? `The provided ${targetModel} ID does not exist.`
      : `The requested ${targetModel} was not found.`;

    return {
      statusCode,
      error,
      clientMessage: 'Something went wrong, please try again.',
      auditMessage,
      eventType: AuditEventType.RESOURCE_NOT_FOUND,
      severity: AuditSeverity.WARN,
      metadata: { operation, targetModel },
    };
  }

  private processError(
    ctx: ErrorContext,
    exception: Prisma.PrismaClientKnownRequestError,
    request: Request,
    response: Response,
  ) {
    this.logger.error(`Data Integrity Error: ${ctx.auditMessage}`, exception);

    this.auditLogProvider.auditRequest(
      {
        eventType: ctx.eventType,
        severity: ctx.severity,
        statusCode: ctx.statusCode,
        errorCode: ctx.error,
        message: ctx.auditMessage,
        metadata: ctx.metadata,
      },
      request,
    );

    response.status(ctx.statusCode).json({
      statusCode: ctx.statusCode,
      message: ctx.clientMessage,
      error: ctx.error,
      timestamp: new Date().toISOString(),
    });
  }

  // Fallback for unhandled Prisma errors
  private handleUnknownError(exception: Prisma.PrismaClientKnownRequestError) {
    this.logger.error(
      `Unhandled Prisma Error: ${exception.code} - ${exception.message}`,
      exception.stack,
    );
    throw new InternalServerErrorException('Database operation failed', { cause: exception });
  }
}
