import {
  Body,
  Controller,
  Delete,
  Get,
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

import { CreatePackDto } from './dto/create-pack.dto';
import { PackDeleteImpactDto } from './dto/pack-delete-impact.dto';
import { PackResponseDto, PackSummaryResponseDto } from './dto/pack-response.dto';
import { UpdatePackDto } from './dto/update-pack.dto';
import { PackService } from './pack.service';

@ApiTags('pack')
@ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized.' })
@ApiResponse({
  status: HttpStatus.TOO_MANY_REQUESTS,
  description: 'ThrottlerException: Too Many Requests.',
})
@Controller('pack')
@UseGuards(BffGuard, JwtAuthGuard)
export class PackController {
  constructor(private readonly packService: PackService) {}

  @Get()
  @ApiBffAndAccessSecurity()
  @ApiOperation({ summary: 'Get all packs' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Packs retrieved successfully.',
    type: [PackSummaryResponseDto],
  })
  @UseGuards(CustomThrottlerGuard)
  @Throttle({ default: { limit: THROTTLE_LIMITS.PACKS.GET_ALL, ttl: THROTTLE_TTL_MS } })
  async getPacks(@CurrentUser('userId') userId: string) {
    return this.packService.getPacks({ userId });
  }

  @Get(':id/delete-impact')
  @ApiBffAndAccessSecurity()
  @ApiOperation({
    summary: 'Get the impact of deleting a pack by ID. Details the trips that will be affected.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pack deletion impact retrieved successfully.',
    type: PackDeleteImpactDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed (uuid v7 is expected)',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Pack not found.' })
  @UseGuards(CustomThrottlerGuard)
  @Throttle({ default: { limit: THROTTLE_LIMITS.PACKS.GET_DELETE_IMPACT, ttl: THROTTLE_TTL_MS } })
  async getPackDeleteImpact(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @CurrentUser('userId') userId: string,
  ): Promise<PackDeleteImpactDto> {
    return this.packService.getPackDeleteImpact(id, userId);
  }

  @Get(':id')
  @ApiBffAndAccessSecurity()
  @ApiOperation({ summary: 'Get a pack by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pack retrieved successfully.',
    type: PackResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed (uuid v7 is expected)',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Pack not found.' })
  @UseGuards(CustomThrottlerGuard)
  @Throttle({ default: { limit: THROTTLE_LIMITS.PACKS.GET, ttl: THROTTLE_TTL_MS } })
  async getPack(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.packService.getPack({ id, userId });
  }

  @Post()
  @ApiBffAndAccessSecurity()
  @ApiOperation({ summary: 'Create a pack' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Pack created successfully.',
    type: PackResponseDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Validation failed (dto)' })
  @UseGuards(CustomThrottlerGuard)
  @Throttle({ default: { limit: THROTTLE_LIMITS.PACKS.POST, ttl: THROTTLE_TTL_MS } })
  async createPack(@Body() pack: CreatePackDto, @CurrentUser('userId') userId: string) {
    return this.packService.createPack(pack, userId);
  }

  @Patch(':id')
  @ApiBffAndAccessSecurity()
  @ApiOperation({ summary: 'Update a pack by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pack updated successfully.',
    type: PackResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed (invalid UUID v7 format or invalid body)',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Pack not found.' })
  @UseGuards(CustomThrottlerGuard)
  @Throttle({ default: { limit: THROTTLE_LIMITS.PACKS.PATCH, ttl: THROTTLE_TTL_MS } })
  async updatePack(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Body() pack: UpdatePackDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.packService.updatePack(id, pack, userId);
  }

  @Delete(':id')
  @ApiBffAndAccessSecurity()
  @ApiOperation({ summary: 'Delete a pack by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Pack deleted successfully.' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed (uuid v7 is expected)',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Pack not found.' })
  @UseGuards(CustomThrottlerGuard)
  @Throttle({ default: { limit: THROTTLE_LIMITS.PACKS.DELETE, ttl: THROTTLE_TTL_MS } })
  async deletePack(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.packService.deletePack(id, userId);
  }
}
