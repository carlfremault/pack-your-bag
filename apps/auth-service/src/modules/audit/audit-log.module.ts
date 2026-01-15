import { Module } from '@nestjs/common';

import { AuditLogProvider } from './audit-log.provider';
import { AuditLogService } from './audit-log.service';

@Module({
  providers: [AuditLogService, AuditLogProvider],
  exports: [AuditLogProvider],
})
export class AuditLogModule {}
