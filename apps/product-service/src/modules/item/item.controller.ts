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

import { THROTTLE_LIMITS, THROTTLE_TTL_MS } from '@/common/constants/product.constants';

import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { ItemDeleteImpact, ItemService } from './item.service';

@ApiTags('item')
@ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Missing or invalid BFF secret.' })
@ApiResponse({ status: HttpStatus.TOO_MANY_REQUESTS, description: 'Rate limit exceeded.' })
@Controller('item')
@UseGuards(BffGuard, JwtAuthGuard)
export class ItemController {
  constructor(private readonly itemService: ItemService) {}

  @Get()
  @ApiBffAndAccessSecurity()
  @ApiOperation({ summary: 'Get all items' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Items retrieved successfully.' })
  @UseGuards(CustomThrottlerGuard)
  @Throttle({ default: { limit: THROTTLE_LIMITS.ITEMS.GET_ALL, ttl: THROTTLE_TTL_MS } })
  async getItems(@CurrentUser('userId') userId: string) {
    return this.itemService.getItems({ userId });
  }

  @Get(':id/delete-impact')
  @ApiBffAndAccessSecurity()
  @ApiOperation({
    summary:
      'Get the impact of deleting an item by ID. Details the lists, packs, and trips that will be affected.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Item deletion impact retrieved successfully.',
  })
  @UseGuards(CustomThrottlerGuard)
  @Throttle({ default: { limit: THROTTLE_LIMITS.ITEMS.GET_DELETE_IMPACT, ttl: THROTTLE_TTL_MS } })
  async getItemDeleteImpact(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
  ): Promise<ItemDeleteImpact> {
    return this.itemService.getItemDeleteImpact(id, userId);
  }

  @Get(':id')
  @ApiBffAndAccessSecurity()
  @ApiOperation({ summary: 'Get an item by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Item retrieved successfully.' })
  @UseGuards(CustomThrottlerGuard)
  @Throttle({ default: { limit: THROTTLE_LIMITS.ITEMS.GET, ttl: THROTTLE_TTL_MS } })
  async getItem(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.itemService.getItem({ id, userId });
  }

  @Post()
  @ApiBffAndAccessSecurity()
  @ApiOperation({ summary: 'Create an item' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Item created successfully.' })
  @UseGuards(CustomThrottlerGuard)
  @Throttle({ default: { limit: THROTTLE_LIMITS.ITEMS.POST, ttl: THROTTLE_TTL_MS } })
  async createItem(@Body() item: CreateItemDto, @CurrentUser('userId') userId: string) {
    return this.itemService.createItem(item, userId);
  }

  @Patch(':id')
  @ApiBffAndAccessSecurity()
  @ApiOperation({ summary: 'Update an item by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Item updated successfully.' })
  @UseGuards(CustomThrottlerGuard)
  @Throttle({ default: { limit: THROTTLE_LIMITS.ITEMS.PATCH, ttl: THROTTLE_TTL_MS } })
  async updateItem(
    @Param('id') id: string,
    @Body() item: UpdateItemDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.itemService.updateItem(id, item, userId);
  }

  @Delete(':id')
  @ApiBffAndAccessSecurity()
  @ApiOperation({ summary: 'Delete an item by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Item deleted successfully.' })
  @UseGuards(CustomThrottlerGuard)
  @Throttle({ default: { limit: THROTTLE_LIMITS.ITEMS.DELETE, ttl: THROTTLE_TTL_MS } })
  async deleteItem(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.itemService.handleItemDeletion(id, userId);
  }
}
