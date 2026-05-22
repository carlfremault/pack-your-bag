import { Module } from '@nestjs/common';

import { AuditLogModule } from '@/modules/audit-log/audit-log.module';

import { BrevoService } from './brevo.service';
import { EmailService } from './email.service';

@Module({
  imports: [AuditLogModule],
  providers: [BrevoService, EmailService],
  exports: [EmailService],
})
export class EmailModule {}
