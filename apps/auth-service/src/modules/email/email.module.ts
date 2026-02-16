import { Module } from '@nestjs/common';

import { AuditLogModule } from '@/modules/audit-log/audit-log.module';

import { EmailService } from './email.service';

@Module({
  imports: [AuditLogModule],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
