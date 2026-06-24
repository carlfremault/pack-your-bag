import { Module } from '@nestjs/common';

import { EmailModule } from '@/modules/email/email.module';
import { RefreshTokenModule } from '@/modules/refresh-token/refresh-token.module';
import { VerificationTokenModule } from '@/modules/verification-token/verification-token.module';

import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserEmailListener } from './user-email.listener';
import { UserEventProvider } from './user-event.provider';

@Module({
  imports: [EmailModule, RefreshTokenModule, VerificationTokenModule],
  controllers: [UserController],
  providers: [UserService, UserEventProvider, UserEmailListener],
  exports: [UserService],
})
export class UserModule {}
