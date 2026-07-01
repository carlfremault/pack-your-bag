import { Catch } from '@nestjs/common';

import { AuditLogProvider, BaseGlobalExceptionsFilter } from '@repo/nestjs-common';

@Catch()
export class GlobalExceptionsFilter extends BaseGlobalExceptionsFilter {
  constructor(auditLogProvider: AuditLogProvider) {
    super(auditLogProvider, GlobalExceptionsFilter.name);
  }
}
