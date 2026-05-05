import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
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

import { THROTTLE_LIMITS, THROTTLE_TTL_MS } from '@/common/constants/product.constants';

import { ListPackResponseDto } from './dto/list-pack-response.dto';
import { UpsertListInPackDto } from './dto/upsert-list-pack.dto';
import { ListPackService } from './list-pack.service';

@ApiTags('list-pack')
@ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized.' })
@ApiResponse({
  status: HttpStatus.TOO_MANY_REQUESTS,
  description: 'ThrottlerException: Too Many Requests.',
})
@Controller('list-pack')
@UseGuards(BffGuard, JwtAuthGuard)
export class ListPackController {
  constructor(private readonly listPackService: ListPackService) {}

  @Post()
  @ApiBffAndAccessSecurity()
  @ApiOperation({ summary: 'Upsert a list to a pack' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List upserted to pack successfully.',
    type: ListPackResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed (dto)',
  })
  @UseGuards(CustomThrottlerGuard)
  @Throttle({ default: { limit: THROTTLE_LIMITS.LIST_PACK.UPSERT, ttl: THROTTLE_TTL_MS } })
  @HttpCode(HttpStatus.OK)
  async upsertListInPack(
    @Body() upsertListInPackDto: UpsertListInPackDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.listPackService.upsertListInPack(upsertListInPackDto, userId);
  }

  @Delete(':listId/:packId')
  @ApiBffAndAccessSecurity()
  @ApiOperation({ summary: 'Remove a list from a pack' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'List removed from pack successfully.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed (invalid UUID v7 format).',
  })
  @UseGuards(CustomThrottlerGuard)
  @Throttle({ default: { limit: THROTTLE_LIMITS.LIST_PACK.REMOVE, ttl: THROTTLE_TTL_MS } })
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeListFromPack(
    @Param('listId', new ParseUUIDPipe({ version: '7' })) listId: string,
    @Param('packId', new ParseUUIDPipe({ version: '7' })) packId: string,
    @CurrentUser('userId') userId: string,
  ) {
    await this.listPackService.removeListFromPack(listId, packId, userId);
  }
}
