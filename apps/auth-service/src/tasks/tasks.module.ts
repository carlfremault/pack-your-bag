import { Module } from '@nestjs/common';

import { AuditLogModule } from '@/modules/audit-log/audit-log.module';
import { RefreshTokenModule } from '@/modules/refresh-token/refresh-token.module';
import { ServiceClientModule } from '@/modules/service-client/service-client.module';
import { UserModule } from '@/modules/user/user.module';
import { VerificationTokenModule } from '@/modules/verification-token/verification-token.module';

import { TasksService } from './tasks.service';

@Module({
  imports: [
    RefreshTokenModule,
    VerificationTokenModule,
    AuditLogModule,
    UserModule,
    ServiceClientModule,
  ],
  providers: [TasksService],
})
export class TasksModule {}
