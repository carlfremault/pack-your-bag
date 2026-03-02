import { Injectable, NotFoundException } from '@nestjs/common';

import { Category, Item, Prisma } from '@repo/db';

import { v7 as uuidv7 } from 'uuid';

import { PrismaService } from '@/prisma/prisma.service';

import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

export interface CategoryDeleteImpact {
  category: Category;
  items: Item[];
}

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // BASIC CRUD OPERATIONS
  // ============================================

  async getCategories(where: Prisma.CategoryWhereInput): Promise<Category[]> {
    return this.prisma.category.findMany({
      where,
    });
  }

  async getCategory(where: Prisma.CategoryWhereUniqueInput): Promise<Category> {
    const result = await this.prisma.category.findUnique({
      where,
    });

    if (!result) {
      throw new NotFoundException('Category not found');
    }

    return result;
  }

  async createCategory(category: CreateCategoryDto, userId: string): Promise<Category> {
    const uuid = uuidv7();

    const data: Prisma.CategoryCreateInput = {
      ...category,
      id: uuid,
      userId: userId,
    };

    return this.prisma.category.create({
      data,
    });
  }

  async updateCategory(id: string, category: UpdateCategoryDto, userId: string): Promise<Category> {
    return this.prisma.$transaction(async (tx) => {
      const storedCategory = await tx.category.findUnique({ where: { id, userId } });
      if (!storedCategory) {
        throw new NotFoundException('Category not found');
      }

      return tx.category.update({
        where: { id, userId },
        data: category,
      });
    });
  }

  async deleteCategory(id: string, userId: string): Promise<Category> {
    return this.prisma.$transaction(async (tx) => {
      const storedCategory = await tx.category.findUnique({ where: { id, userId } });
      if (!storedCategory) {
        throw new NotFoundException('Category not found');
      }

      return tx.category.delete({
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

    return { category, items };
  }
}
