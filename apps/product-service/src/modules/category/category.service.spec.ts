import { Test, TestingModule } from '@nestjs/testing';

import { Category } from '@repo/db';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PrismaService } from '@/prisma/prisma.service';

import { CategoryService } from './category.service';

describe('CategoryService', () => {
  let service: CategoryService;
  let prisma: PrismaService;

  const mockPrismaService = {
    category: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    item: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn((callback: (tx: typeof mockPrismaService) => Promise<Category>) => {
      return callback(mockPrismaService);
    }),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [CategoryService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(prisma).toBeDefined();
  });

  describe('createCategory', () => {
    it('should build correct create data with userId and id', async () => {
      const userId = 'user-1';
      const dto = { name: 'Test Category', description: 'Test Description', colorTheme: 'slate' };
      let capturedData: Record<string, unknown> = {};
      mockPrismaService.category.create.mockImplementation(
        (args: { data: Record<string, unknown> }) => {
          capturedData = args.data;
          return Promise.resolve({ id: capturedData.id, ...dto, userId });
        },
      );

      await service.createCategory(dto as never, userId);

      expect(capturedData).toMatchObject({
        name: 'Test Category',
        description: 'Test Description',
        colorTheme: 'slate',
      });
      expect(capturedData.id).toBeDefined();
      expect(typeof capturedData.id).toBe('string');
    });
  });

  describe('updateCategory', () => {
    it('should update a category', async () => {
      const id = 'category-1';
      const userId = 'user-1';
      const dto = {
        name: 'Updated Category',
        description: 'Updated Description',
        colorTheme: 'slate',
      };

      mockPrismaService.category.findUnique.mockResolvedValue({ id, userId });

      await service.updateCategory(id, dto as never, userId);

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(mockPrismaService.category.findUnique).toHaveBeenCalledWith({
        where: { id, userId },
      });
      expect(mockPrismaService.category.update).toHaveBeenCalledWith({
        where: { id, userId },
        data: dto,
      });
    });

    it('should throw an error if the category is not found', async () => {
      const id = 'category-1';
      const userId = 'user-1';
      const dto = {
        name: 'Updated Category',
        description: 'Updated Description',
        colorTheme: 'slate',
      };
      mockPrismaService.category.findUnique.mockResolvedValue(null);

      await expect(service.updateCategory(id, dto as never, userId)).rejects.toThrow(
        'Category not found',
      );

      expect(mockPrismaService.category.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteCategory', () => {
    it('should run in transaction and delete the category', async () => {
      const id = 'category-1';
      const userId = 'user-1';
      mockPrismaService.category.findUnique.mockResolvedValue({ id, userId });
      mockPrismaService.category.delete.mockResolvedValue({ id, userId });

      await service.deleteCategory(id, userId);

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(mockPrismaService.category.findUnique).toHaveBeenCalledWith({
        where: { id, userId },
      });
      expect(mockPrismaService.category.delete).toHaveBeenCalledWith({
        where: { id, userId },
      });
    });

    it('should throw an error if the category is not found', async () => {
      const id = 'category-1';
      const userId = 'user-1';
      mockPrismaService.category.findUnique.mockResolvedValue(null);

      await expect(service.deleteCategory(id, userId)).rejects.toThrow('Category not found');

      expect(mockPrismaService.category.delete).not.toHaveBeenCalled();
    });
  });

  describe('getCategoryDeleteImpact', () => {
    it('should return the category and items', async () => {
      const id = 'category-1';
      const userId = 'user-1';
      mockPrismaService.category.findUnique.mockResolvedValue({ id, userId });
      mockPrismaService.item.findMany.mockResolvedValue([{ id: 'item-1', userId }]);

      const result = await service.getCategoryDeleteImpact(id, userId);

      expect(mockPrismaService.category.findUnique).toHaveBeenCalledWith({
        where: { id, userId },
      });
      expect(mockPrismaService.item.findMany).toHaveBeenCalledWith({
        where: { userId, categoryId: id },
      });

      expect(result).toMatchObject({
        category: { id },
        items: [{ id: 'item-1' }],
      });
    });

    it('should throw an error if the category is not found', async () => {
      const id = 'category-1';
      const userId = 'user-1';
      mockPrismaService.category.findUnique.mockResolvedValue(null);

      await expect(service.getCategoryDeleteImpact(id, userId)).rejects.toThrow(
        'Category not found',
      );
    });
  });

  describe('response mapping', () => {
    it('should map the category and items to corresponding response dtos', async () => {
      const userId = 'user-1';
      const category = {
        id: 'category-1',
        name: 'Test Category',
        description: 'Test Description',
        colorTheme: 'slate',
        userId,
      };
      const items = [
        { id: 'item-1', name: 'Test Item', description: 'Test Description', weight: 1, userId },
      ];
      mockPrismaService.item.findMany.mockResolvedValue(items);
      mockPrismaService.category.findUnique.mockResolvedValue(category);

      const result = await service.getCategoryDeleteImpact(category.id, userId);

      expect(result).toMatchObject({
        category: {
          id: 'category-1',
          name: 'Test Category',
          description: 'Test Description',
          colorTheme: 'slate',
        },
        items: [{ id: 'item-1', name: 'Test Item', description: 'Test Description', weight: 1 }],
      });
    });
  });
});
