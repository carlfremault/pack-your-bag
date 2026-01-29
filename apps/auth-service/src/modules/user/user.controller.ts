import { Body, Controller, Delete, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { THROTTLE_LIMITS, THROTTLE_TTL } from '@/common/constants/auth.constants';
import { AuditLog } from '@/common/decorators/audit-log.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { BffGuard } from '@/common/guards/bff.guard';
import { CustomThrottlerGuard } from '@/common/guards/custom-throttler.guard';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { AuditEventType } from '@/generated/prisma';

import { DeleteUserDto } from './dto/delete-user.dto';
import { UserService } from './user.service';

@Controller('user')
@UseGuards(BffGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard, CustomThrottlerGuard)
  @Throttle({ default: { limit: THROTTLE_LIMITS.DELETE_USER, ttl: THROTTLE_TTL } })
  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @AuditLog(AuditEventType.USER_DELETED)
  async deleteUser(
    @Body() body: DeleteUserDto,
    @CurrentUser('userId') userId: string,
  ): Promise<void> {
    return this.userService.softDeleteUser(userId, body);
  }
}
