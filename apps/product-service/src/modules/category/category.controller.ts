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

import { CategoryDeleteImpactDto } from './dto/category-delete-impact.dto';
import { CategoryResponseDto } from './dto/category-response.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryService } from './category.service';

@ApiTags('category')
@ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized.' })
@ApiResponse({
  status: HttpStatus.TOO_MANY_REQUESTS,
  description: 'ThrottlerException: Too Many Requests.',
})
@Controller('category')
@UseGuards(BffGuard, JwtAuthGuard)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @ApiBffAndAccessSecurity()
  @ApiOperation({ summary: 'Get all categories' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Categories retrieved successfully.',
    type: [CategoryResponseDto],
  })
  @UseGuards(CustomThrottlerGuard)
  @Throttle({ default: { limit: THROTTLE_LIMITS.CATEGORIES.GET_ALL, ttl: THROTTLE_TTL_MS } })
  async getCategories(@CurrentUser('userId') userId: string) {
    return this.categoryService.getCategories({ userId });
  }

  @Get(':id/delete-impact')
  @ApiBffAndAccessSecurity()
  @ApiOperation({
    summary:
      'Get the impact of deleting a category by ID. Gives the number of items in the category.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Category deletion impact retrieved successfully.',
    type: CategoryDeleteImpactDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed (uuid v7 is expected)',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Category not found.' })
  @UseGuards(CustomThrottlerGuard)
  @Throttle({
    default: { limit: THROTTLE_LIMITS.CATEGORIES.GET_DELETE_IMPACT, ttl: THROTTLE_TTL_MS },
  })
  async getCategoryDeleteImpact(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @CurrentUser('userId') userId: string,
  ): Promise<CategoryDeleteImpactDto> {
    return this.categoryService.getCategoryDeleteImpact(id, userId);
  }

  @Get(':id')
  @ApiBffAndAccessSecurity()
  @ApiOperation({ summary: 'Get a category by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Category retrieved successfully.',
    type: CategoryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed (uuid v7 is expected)',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Category not found.' })
  @UseGuards(CustomThrottlerGuard)
  @Throttle({ default: { limit: THROTTLE_LIMITS.CATEGORIES.GET, ttl: THROTTLE_TTL_MS } })
  async getCategory(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.categoryService.getCategory({ id, userId });
  }

  @Post()
  @ApiBffAndAccessSecurity()
  @ApiOperation({ summary: 'Create a category' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Category created successfully.',
    type: CategoryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed (dto)',
  })
  @UseGuards(CustomThrottlerGuard)
  @Throttle({ default: { limit: THROTTLE_LIMITS.CATEGORIES.POST, ttl: THROTTLE_TTL_MS } })
  async createCategory(@Body() category: CreateCategoryDto, @CurrentUser('userId') userId: string) {
    return this.categoryService.createCategory(category, userId);
  }

  @Patch(':id')
  @ApiBffAndAccessSecurity()
  @ApiOperation({ summary: 'Update a category by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Category updated successfully.',
    type: CategoryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed (invalid UUID v7 format or invalid body).',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Category not found.' })
  @UseGuards(CustomThrottlerGuard)
  @Throttle({ default: { limit: THROTTLE_LIMITS.CATEGORIES.PATCH, ttl: THROTTLE_TTL_MS } })
  async updateCategory(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Body() category: UpdateCategoryDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.categoryService.updateCategory(id, category, userId);
  }

  @Delete(':id')
  @ApiBffAndAccessSecurity()
  @ApiOperation({ summary: 'Delete a category by ID' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Category deleted successfully.' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed (uuid v7 is expected)',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Category not found.' })
  @UseGuards(CustomThrottlerGuard)
  @Throttle({ default: { limit: THROTTLE_LIMITS.CATEGORIES.DELETE, ttl: THROTTLE_TTL_MS } })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCategory(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @CurrentUser('userId') userId: string,
  ) {
    await this.categoryService.deleteCategory(id, userId);
  }
}
