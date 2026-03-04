import { Injectable, NotFoundException } from '@nestjs/common';

import { Prisma } from '@repo/db';

import { plainToInstance } from 'class-transformer';
import { v7 as uuidv7 } from 'uuid';

import { ItemResponseDto } from '@/common/dto/item-response.dto';
import { PrismaService } from '@/prisma/prisma.service';

import { CategoryResponseDto } from './dto/category-response.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

export interface CategoryDeleteImpact {
  category: CategoryResponseDto;
  items: ItemResponseDto[];
}

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // BASIC CRUD OPERATIONS
  // ============================================

  async getCategories(where: Prisma.CategoryWhereInput): Promise<CategoryResponseDto[]> {
    const result = await this.prisma.category.findMany({
      where,
    });

    return plainToInstance(CategoryResponseDto, result);
  }

  async getCategory(where: Prisma.CategoryWhereUniqueInput): Promise<CategoryResponseDto> {
    const result = await this.prisma.category.findUnique({
      where,
    });

    if (!result) {
      throw new NotFoundException('Category not found');
    }

    return plainToInstance(CategoryResponseDto, result);
  }

  async createCategory(category: CreateCategoryDto, userId: string): Promise<CategoryResponseDto> {
    const uuid = uuidv7();

    const data: Prisma.CategoryCreateInput = {
      ...category,
      id: uuid,
      userId: userId,
    };

    const result = await this.prisma.category.create({
      data,
    });

    return plainToInstance(CategoryResponseDto, result);
  }

  async updateCategory(
    id: string,
    category: UpdateCategoryDto,
    userId: string,
  ): Promise<CategoryResponseDto> {
    return this.prisma.$transaction(async (tx) => {
      const storedCategory = await tx.category.findUnique({ where: { id, userId } });
      if (!storedCategory) {
        throw new NotFoundException('Category not found');
      }

      const result = await tx.category.update({
        where: { id, userId },
        data: category,
      });

      return plainToInstance(CategoryResponseDto, result);
    });
  }

  async deleteCategory(id: string, userId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const storedCategory = await tx.category.findUnique({ where: { id, userId } });
      if (!storedCategory) {
        throw new NotFoundException('Category not found');
      }

      // Item uses SetNull, so handled automatically by the DB.
      await tx.category.delete({
        where: { id, userId },
      });
    });
  }

  // ============================================
  // CATEGORY MANAGEMENT
  // ============================================

  async getCategoryDeleteImpact(id: string, userId: string): Promise<CategoryDeleteImpact> {
    const category = await this.prisma.category.findUnique({ where: { id, userId } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const items = await this.prisma.item.findMany({
      where: { categoryId: id },
    });

    return {
      category: plainToInstance(CategoryResponseDto, category),
      items: plainToInstance(ItemResponseDto, items),
    };
  }
}
