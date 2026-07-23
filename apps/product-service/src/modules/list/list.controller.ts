import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
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

import { CloneListDto } from './dto/clone-list.dto';
import { CreateListDto } from './dto/create-list.dto';
import { ListDeleteImpactDto } from './dto/list-delete-impact.dto';
import { ListResponseDto, ListSummaryResponseDto } from './dto/list-response.dto';
import { UpdateListDto } from './dto/update-list.dto';
import { ListService } from './list.service';

@ApiTags('list')
@ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized.' })
@ApiResponse({
  status: HttpStatus.TOO_MANY_REQUESTS,
  description: 'ThrottlerException: Too Many Requests.',
})
@Controller('list')
@UseGuards(BffGuard, JwtAuthGuard)
export class ListController {
  constructor(private readonly listService: ListService) {}

  @Get()
  @ApiBffAndAccessSecurity()
  @ApiOperation({ summary: 'Get all lists' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lists retrieved successfully.',
    type: [ListSummaryResponseDto],
  })
  @UseGuards(CustomThrottlerGuard)
  @Throttle({ default: { limit: THROTTLE_LIMITS.LISTS.GET_ALL, ttl: THROTTLE_TTL_MS } })
  async getLists(@CurrentUser('userId') userId: string) {
    return this.listService.getLists({ userId });
  }

  @Get(':id/delete-impact')
  @ApiBffAndAccessSecurity()
  @ApiOperation({
    summary:
      'Get the impact of deleting a list by ID. Details the packs and trips that will be affected.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List deletion impact retrieved successfully.',
    type: ListDeleteImpactDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed (uuid v7 is expected)',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'List not found.' })
  @UseGuards(CustomThrottlerGuard)
  @Throttle({ default: { limit: THROTTLE_LIMITS.LISTS.GET_DELETE_IMPACT, ttl: THROTTLE_TTL_MS } })
  async getListDeleteImpact(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @CurrentUser('userId') userId: string,
  ): Promise<ListDeleteImpactDto> {
    return this.listService.getListDeleteImpact(id, userId);
  }

  @Get(':id')
  @ApiBffAndAccessSecurity()
  @ApiOperation({ summary: 'Get a list by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List retrieved successfully.',
    type: ListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed (uuid v7 is expected)',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'List not found.' })
  @UseGuards(CustomThrottlerGuard)
  @Throttle({ default: { limit: THROTTLE_LIMITS.LISTS.GET, ttl: THROTTLE_TTL_MS } })
  async getList(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.listService.getList({ id, userId });
  }

  @Post()
  @ApiBffAndAccessSecurity()
  @ApiOperation({ summary: 'Create a list' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'List created successfully.',
    type: ListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed (dto)',
  })
  @UseGuards(CustomThrottlerGuard)
  @Throttle({ default: { limit: THROTTLE_LIMITS.LISTS.POST, ttl: THROTTLE_TTL_MS } })
  async createList(@Body() list: CreateListDto, @CurrentUser('userId') userId: string) {
    return this.listService.createList(list, userId);
  }

  @Post(':id/clone')
  @ApiBffAndAccessSecurity()
  @ApiOperation({ summary: 'Clone a list from ID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'List cloned successfully.',
    type: ListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed (invalid UUID v7 format or invalid body)',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'List not found.' })
  @UseGuards(CustomThrottlerGuard)
  @Throttle({ default: { limit: THROTTLE_LIMITS.LISTS.POST, ttl: THROTTLE_TTL_MS } })
  async cloneList(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Body() body: CloneListDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.listService.cloneList(id, body.newName, userId);
  }

  @Patch(':id')
  @ApiBffAndAccessSecurity()
  @ApiOperation({ summary: 'Update a list by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List updated successfully.',
    type: ListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed (invalid UUID v7 format or invalid body).',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'List not found.' })
  @UseGuards(CustomThrottlerGuard)
  @Throttle({ default: { limit: THROTTLE_LIMITS.LISTS.PATCH, ttl: THROTTLE_TTL_MS } })
  async updateList(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Body() list: UpdateListDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.listService.updateList(id, list, userId);
  }

  @Delete(':id')
  @ApiBffAndAccessSecurity()
  @ApiOperation({ summary: 'Delete a list by ID' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'List deleted successfully.' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed (uuid v7 is expected)',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'List not found.' })
  @UseGuards(CustomThrottlerGuard)
  @Throttle({ default: { limit: THROTTLE_LIMITS.LISTS.DELETE, ttl: THROTTLE_TTL_MS } })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteList(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @CurrentUser('userId') userId: string,
  ) {
    await this.listService.handleListDeletion(id, userId);
  }
}
