import { Catch } from '@nestjs/common';

import { Prisma } from '@repo/db';
import { BasePrismaExceptionsFilter, ErrorContext } from '@repo/nestjs-common';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter extends BasePrismaExceptionsFilter {
  constructor() {
    super(PrismaExceptionFilter.name);
  }

  protected handleException(
    errorContext: ErrorContext,
    exception: Prisma.PrismaClientKnownRequestError,
  ): void {
    this.logger.error(`Data Integrity Error: ${errorContext.auditMessage}`, exception.stack);
  }
}
