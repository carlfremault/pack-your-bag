import { Module } from '@nestjs/common';

import { RefreshTokenModule } from '@/modules/refresh-token/refresh-token.module';
import { ServiceClientModule } from '@/modules/service-client/service-client.module';
import { UserModule } from '@/modules/user/user.module';
import { VerificationTokenModule } from '@/modules/verification-token/verification-token.module';

import { TasksService } from './tasks.service';

@Module({
  imports: [RefreshTokenModule, VerificationTokenModule, UserModule, ServiceClientModule],
  providers: [TasksService],
})
export class TasksModule {}
