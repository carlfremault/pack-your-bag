import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import {
  ApiBffAndAccessSecurity,
  BffGuard,
  CurrentUser,
  CustomThrottlerGuard,
  JwtAuthGuard,
} from '@repo/nestjs-common';

import { THROTTLE_LIMITS, THROTTLE_TTL_MS } from '@/common/constants/user-data.constants';

import { CreatePreferencesDto } from './dto/create-preferences.dto';
import { PreferencesResponseDto } from './dto/preferences-response.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { PreferencesService } from './preferences.service';

@ApiTags('preferences')
@ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized.' })
@ApiResponse({
  status: HttpStatus.TOO_MANY_REQUESTS,
  description: 'ThrottlerException: Too Many Requests.',
})
@Controller('preferences')
@UseGuards(BffGuard, JwtAuthGuard)
export class PreferencesController {
  constructor(private readonly preferencesService: PreferencesService) {}

  @Get()
  @ApiBffAndAccessSecurity()
  @ApiOperation({ summary: "Get a user's preferences by user ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User preferences retrieved successfully.',
    type: PreferencesResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User preferences not found.' })
  @UseGuards(CustomThrottlerGuard)
  @Throttle({ default: { limit: THROTTLE_LIMITS.GET, ttl: THROTTLE_TTL_MS } })
  async getPreference(
    @CurrentUser('userId') userId: string,
  ): Promise<PreferencesResponseDto | null> {
    return this.preferencesService.getPreference(userId);
  }

  @Post()
  @ApiBffAndAccessSecurity()
  @ApiOperation({ summary: "Create a user's preferences" })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User preferences created successfully.',
    type: PreferencesResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed (dto)',
  })
  @UseGuards(CustomThrottlerGuard)
  @Throttle({ default: { limit: THROTTLE_LIMITS.POST, ttl: THROTTLE_TTL_MS } })
  async createPreference(
    @Body() preference: CreatePreferencesDto,
    @CurrentUser('userId') userId: string,
  ): Promise<PreferencesResponseDto> {
    return this.preferencesService.createPreference(preference, userId);
  }

  @Patch()
  @ApiBffAndAccessSecurity()
  @ApiOperation({ summary: "Update a user's preferences by user ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User preferences updated successfully.',
    type: PreferencesResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed (dto)',
  })
  @UseGuards(CustomThrottlerGuard)
  @Throttle({ default: { limit: THROTTLE_LIMITS.PATCH, ttl: THROTTLE_TTL_MS } })
  async updatePreference(
    @Body() preference: UpdatePreferencesDto,
    @CurrentUser('userId') userId: string,
  ): Promise<PreferencesResponseDto | null> {
    return this.preferencesService.updatePreference(userId, preference);
  }

  @Delete()
  @ApiBffAndAccessSecurity()
  @ApiOperation({ summary: "Delete a user's preferences by user ID" })
  @ApiResponse({ status: HttpStatus.OK, description: 'User preferences deleted successfully.' })
  @UseGuards(CustomThrottlerGuard)
  @Throttle({ default: { limit: THROTTLE_LIMITS.DELETE, ttl: THROTTLE_TTL_MS } })
  async deletePreference(@CurrentUser('userId') userId: string): Promise<boolean> {
    return this.preferencesService.deletePreference(userId);
  }
}
