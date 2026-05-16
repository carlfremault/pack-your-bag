import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';

import { InternalGuard } from '@repo/nestjs-common';

import { CleanupResultDto, CleanupUsersDto } from './dto/cleanup-users.dto';
import { CleanupService } from './cleanup.service';

@ApiTags('internal')
@ApiSecurity('internal-secret')
@Controller('internal/cleanup')
@UseGuards(InternalGuard)
export class CleanupController {
  constructor(private readonly cleanupService: CleanupService) {}

  @Post('users')
  @ApiOperation({ summary: 'Delete all user data (preferences) for the given user IDs' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User data cleaned up successfully.',
    type: CleanupResultDto,
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized.' })
  @HttpCode(HttpStatus.OK)
  async cleanupUsers(@Body() body: CleanupUsersDto): Promise<CleanupResultDto> {
    return this.cleanupService.deleteUserData(body.userIds);
  }
}
