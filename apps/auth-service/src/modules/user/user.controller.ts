import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { AuditEventType } from '@repo/db';

import { THROTTLE_LIMITS, THROTTLE_TTL_MS } from '@/common/constants/auth.constants';
import {
  ApiBffAndAccessSecurity,
  ApiBffSecurity,
} from '@/common/decorators/api-security.decorator';
import { AuditLog } from '@/common/decorators/audit-log.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { BffGuard } from '@/common/guards/bff.guard';
import { CustomThrottlerGuard } from '@/common/guards/custom-throttler.guard';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

import { CancelDeletionDto } from './dto/cancel-deletion.dto';
import { DeleteUserDto } from './dto/delete-user.dto';
import { UserService } from './user.service';

@ApiTags('user')
@ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Missing or invalid BFF secret.' })
@ApiResponse({ status: HttpStatus.TOO_MANY_REQUESTS, description: 'Rate limit exceeded.' })
@Controller('user')
@UseGuards(BffGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('delete')
  @ApiBffAndAccessSecurity()
  @ApiOperation({
    summary: 'Request account deletion — account is permanently removed after a grace period',
  })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'User deleted.' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid password.' })
  @UseGuards(JwtAuthGuard, CustomThrottlerGuard)
  @Throttle({ default: { limit: THROTTLE_LIMITS.DELETE_USER, ttl: THROTTLE_TTL_MS } })
  @HttpCode(HttpStatus.NO_CONTENT)
  @AuditLog(AuditEventType.USER_DELETED)
  async deleteUser(
    @Body() body: DeleteUserDto,
    @CurrentUser('userId') userId: string,
  ): Promise<void> {
    return this.userService.softDeleteUser(userId, body);
  }

  @Post('cancel-deletion')
  @ApiBffSecurity()
  @ApiOperation({
    summary: 'Cancel account deletion using a token from the deletion confirmation email',
  })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Account deletion cancelled.' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Token invalid, expired, or already used.',
  })
  @UseGuards(CustomThrottlerGuard)
  @Throttle({ default: { limit: THROTTLE_LIMITS.CANCEL_ACCOUNT_DELETION, ttl: THROTTLE_TTL_MS } })
  @HttpCode(HttpStatus.NO_CONTENT)
  @AuditLog(AuditEventType.CANCEL_ACCOUNT_DELETION)
  async cancelAccountDeletion(@Body() body: CancelDeletionDto): Promise<void> {
    return this.userService.cancelAccountDeletion(body);
  }
}
