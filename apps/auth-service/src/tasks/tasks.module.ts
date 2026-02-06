import { Module } from '@nestjs/common';

import { AuditLogModule } from '@/modules/audit-log/audit-log.module';
import { RefreshTokenModule } from '@/modules/refresh-token/refresh-token.module';
import { UserModule } from '@/modules/user/user.module';

import { TasksService } from './tasks.service';

@Module({
  imports: [RefreshTokenModule, AuditLogModule, UserModule],
  providers: [TasksService],
})
export class TasksModule {}
