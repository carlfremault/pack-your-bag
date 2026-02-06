import { Module } from '@nestjs/common';

import { BffGuard } from '@/common/guards/bff.guard';
import { CustomThrottlerGuard } from '@/common/guards/custom-throttler.guard';
import { JwtAuthStrategy } from '@/common/strategies/jwt-auth.strategy';
import { AuditLogModule } from '@/modules/audit-log/audit-log.module';
import { RefreshTokenModule } from '@/modules/refresh-token/refresh-token.module';

import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [AuditLogModule, RefreshTokenModule],
  controllers: [UserController],
  providers: [UserService, JwtAuthStrategy, CustomThrottlerGuard, BffGuard],
  exports: [UserService],
})
export class UserModule {}
