import { Module } from '@nestjs/common';

import { RpcExceptionFilter } from '@/common/filters/rpc-exception.filter';

import { AuditLogController } from './audit-log.controller';
import { AuditLogService } from './audit-log.service';

@Module({
  providers: [AuditLogService, RpcExceptionFilter],
  controllers: [AuditLogController],
  exports: [AuditLogService],
})
export class AuditLogModule {}
