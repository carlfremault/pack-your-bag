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

import { CreateTripDto } from './dto/create-trip.dto';
import { TripResponseDto, TripSummaryResponseDto } from './dto/trip-response.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { UpdateTripItemStatusDto } from './dto/update-trip-item-status.dto';
import { TripService } from './trip.service';

@ApiTags('trip')
@ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized.' })
@ApiResponse({
  status: HttpStatus.TOO_MANY_REQUESTS,
  description: 'ThrottlerException: Too Many Requests.',
})
@Controller('trip')
@UseGuards(BffGuard, JwtAuthGuard)
export class TripController {
  constructor(private readonly tripService: TripService) {}

  @Get()
  @ApiBffAndAccessSecurity()
  @ApiOperation({ summary: 'Get all trips' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Trips retrieved successfully.',
    type: [TripSummaryResponseDto],
  })
  @UseGuards(CustomThrottlerGuard)
  @Throttle({ default: { limit: THROTTLE_LIMITS.TRIPS.GET_ALL, ttl: THROTTLE_TTL_MS } })
  async getTrips(@CurrentUser('userId') userId: string) {
    return this.tripService.getTrips({ userId });
  }

  @Get(':id')
  @ApiBffAndAccessSecurity()
  @ApiOperation({ summary: 'Get a trip by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Trip retrieved successfully.',
    type: TripResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed (uuid v7 is expected)',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Trip not found.' })
  @UseGuards(CustomThrottlerGuard)
  @Throttle({ default: { limit: THROTTLE_LIMITS.TRIPS.GET, ttl: THROTTLE_TTL_MS } })
  async getTrip(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.tripService.getTrip({ id, userId });
  }

  @Post()
  @ApiBffAndAccessSecurity()
  @ApiOperation({ summary: 'Create a trip' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Trip created successfully.',
    type: TripResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed (dto)',
  })
  @UseGuards(CustomThrottlerGuard)
  @Throttle({ default: { limit: THROTTLE_LIMITS.TRIPS.POST, ttl: THROTTLE_TTL_MS } })
  async createTrip(@Body() trip: CreateTripDto, @CurrentUser('userId') userId: string) {
    return this.tripService.createTrip(trip, userId);
  }

  @Patch(':id')
  @ApiBffAndAccessSecurity()
  @ApiOperation({ summary: 'Update a trip by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Trip updated successfully.',
    type: TripResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed (invalid UUID v7 format or invalid body).',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Trip not found.' })
  @UseGuards(CustomThrottlerGuard)
  @Throttle({ default: { limit: THROTTLE_LIMITS.TRIPS.PATCH, ttl: THROTTLE_TTL_MS } })
  async updateTrip(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Body() trip: UpdateTripDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.tripService.updateTrip(id, trip, userId);
  }

  @Patch(':id/items/:itemId/packed')
  @ApiBffAndAccessSecurity()
  @ApiOperation({ summary: 'Set packed quantity for an item in a trip' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Item packing status updated.' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed (invalid UUID v7 format or invalid body).',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Trip not found.' })
  @UseGuards(CustomThrottlerGuard)
  @Throttle({ default: { limit: THROTTLE_LIMITS.TRIPS.SET_ITEM_STATUS, ttl: THROTTLE_TTL_MS } })
  @HttpCode(HttpStatus.NO_CONTENT)
  async setTripItemStatus(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Param('itemId', new ParseUUIDPipe({ version: '7' })) itemId: string,
    @Body() dto: UpdateTripItemStatusDto,
    @CurrentUser('userId') userId: string,
  ) {
    await this.tripService.setTripItemStatus(id, itemId, userId, dto.packedQuantity);
  }

  @Delete(':id')
  @ApiBffAndAccessSecurity()
  @ApiOperation({ summary: 'Delete a trip by ID' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Trip deleted successfully.' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed (uuid v7 is expected)',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Trip not found.' })
  @UseGuards(CustomThrottlerGuard)
  @Throttle({ default: { limit: THROTTLE_LIMITS.TRIPS.DELETE, ttl: THROTTLE_TTL_MS } })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTrip(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @CurrentUser('userId') userId: string,
  ) {
    await this.tripService.deleteTrip(id, userId);
  }
}
