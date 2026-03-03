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

import { UpsertItemInPackDto } from './dto/upsert-item-pack.dto';
import { ItemPackService } from './item-pack.service';

@ApiTags('item-pack')
@ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized.' })
@ApiResponse({
  status: HttpStatus.TOO_MANY_REQUESTS,
  description: 'ThrottlerException: Too Many Requests.',
})
@Controller('item-pack')
@UseGuards(BffGuard, JwtAuthGuard)
export class ItemPackController {
  constructor(private readonly itemPackService: ItemPackService) {}

  @Post()
  @ApiBffAndAccessSecurity()
  @ApiOperation({ summary: 'Upsert an item to a pack' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Item upserted to pack successfully.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Validation failed (dto)' })
  @UseGuards(CustomThrottlerGuard)
  @Throttle({ default: { limit: THROTTLE_LIMITS.ITEM_PACK.UPSERT, ttl: THROTTLE_TTL_MS } })
  @HttpCode(HttpStatus.OK)
  async upsertItemInPack(
    @Body() upsertItemInPackDto: UpsertItemInPackDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.itemPackService.upsertItemInPack(upsertItemInPackDto, userId);
  }

  @Delete(':itemId/:packId')
  @ApiBffAndAccessSecurity()
  @ApiOperation({ summary: 'Remove an item from a pack' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Item removed from pack successfully.' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed (invalid UUID v7 format).',
  })
  @UseGuards(CustomThrottlerGuard)
  @Throttle({ default: { limit: THROTTLE_LIMITS.ITEM_PACK.REMOVE, ttl: THROTTLE_TTL_MS } })
  async removeItemFromPack(
    @Param('itemId', new ParseUUIDPipe({ version: '7' })) itemId: string,
    @Param('packId', new ParseUUIDPipe({ version: '7' })) packId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.itemPackService.removeItemFromPack(itemId, packId, userId);
  }
}
