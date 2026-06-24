import { Module } from '@nestjs/common';

import { AuditLogModule } from '@/modules/audit-log/audit-log.module';

import { TasksService } from './tasks.service';

@Module({
  imports: [AuditLogModule],
  providers: [TasksService],
})
export class TasksModule {}
