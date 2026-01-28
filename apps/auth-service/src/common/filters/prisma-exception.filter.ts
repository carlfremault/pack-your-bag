import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

import { Prisma } from '@prisma-client';
import { Response } from 'express';

import capitalizeFirstLetter from '@/common/utils/capitalizeFirstLetter';

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

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name, { timestamp: true });

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    switch (exception.code) {
      case 'P2002': {
        // Unique constraint failed

        let statusCode = HttpStatus.CONFLICT;
        let message = 'Record already exists.';
        let error = 'Conflict';

        const meta = exception.meta as PrismaDriverError;
        const adapterFields = meta?.driverAdapterError?.cause?.constraint?.fields;
        const standardFields = meta?.target;
        const fields = standardFields || adapterFields || [];

        if (fields.includes('id')) {
          // One-in-a-trillion chance of this happening.
          // Don't bother user with details, user can just try again.
          this.logger.warn('Data Integrity Error: ID Collision detected', exception);
          statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
          message = 'Something went wrong, please try again.';
          error = 'Internal Server Error';
        } else if (fields.length) {
          message = `${capitalizeFirstLetter(fields.join(', '))} already exists.`;
        }

        response.status(statusCode).json({
          statusCode,
          message,
          error,
          timestamp: new Date().toISOString(),
        });
        break;
      }
      case 'P2025': {
        // Record not found

        const meta = exception.meta as PrismaDriverError;
        const targetModel = meta?.model || meta?.modelName || 'record';
        const operation = meta?.operation;

        const isRelationError = operation?.toLowerCase().includes('nested connect');

        const statusCode = isRelationError ? HttpStatus.BAD_REQUEST : HttpStatus.NOT_FOUND;
        const message = isRelationError
          ? `The provided ${targetModel} ID does not exist.`
          : `The requested ${targetModel} was not found.`;
        const error = isRelationError ? 'Bad Request' : 'Not Found';

        response.status(statusCode).json({
          statusCode,
          message,
          error,
          timestamp: new Date().toISOString(),
        });
        break;
      }
      default: {
        this.logger.error(
          `Unhandled Prisma Error: ${exception.code} - ${exception.message}`,
          exception.stack,
        );

        throw new InternalServerErrorException('Database operation failed', { cause: exception });
      }
    }
  }
}
