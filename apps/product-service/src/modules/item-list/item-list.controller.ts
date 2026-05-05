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

import { ItemListResponseDto } from './dto/item-list-response.dto';
import { UpsertItemOnListDto } from './dto/upsert-item-list.dto';
import { ItemListService } from './item-list.service';

@ApiTags('item-list')
@ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized.' })
@ApiResponse({
  status: HttpStatus.TOO_MANY_REQUESTS,
  description: 'ThrottlerException: Too Many Requests.',
})
@Controller('item-list')
@UseGuards(BffGuard, JwtAuthGuard)
export class ItemListController {
  constructor(private readonly itemListService: ItemListService) {}

  @Post()
  @ApiBffAndAccessSecurity()
  @ApiOperation({ summary: 'Upsert an item to a list' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Item upserted to list successfully.',
    type: ItemListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed (dto)',
  })
  @UseGuards(CustomThrottlerGuard)
  @Throttle({ default: { limit: THROTTLE_LIMITS.ITEM_LIST.UPSERT, ttl: THROTTLE_TTL_MS } })
  @HttpCode(HttpStatus.OK)
  async upsertItemOnList(
    @Body() upsertItemOnListDto: UpsertItemOnListDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.itemListService.upsertItemOnList(upsertItemOnListDto, userId);
  }

  @Delete(':itemId/:listId')
  @ApiBffAndAccessSecurity()
  @ApiOperation({ summary: 'Remove an item from a list' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Item removed from list successfully.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed (invalid UUID v7 format).',
  })
  @UseGuards(CustomThrottlerGuard)
  @Throttle({ default: { limit: THROTTLE_LIMITS.ITEM_LIST.REMOVE, ttl: THROTTLE_TTL_MS } })
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeItemFromList(
    @Param('itemId', new ParseUUIDPipe({ version: '7' })) itemId: string,
    @Param('listId', new ParseUUIDPipe({ version: '7' })) listId: string,
    @CurrentUser('userId') userId: string,
  ) {
    await this.itemListService.removeItemFromList(itemId, listId, userId);
  }
}
