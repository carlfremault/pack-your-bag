import { HttpStatus } from '@nestjs/common';

import { v7 as uuidv7 } from 'uuid';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { CreateCategoryDto } from '@/modules/category/dto/create-category.dto';
import { UpdateCategoryDto } from '@/modules/category/dto/update-category.dto';

import { createIntegrationContext, IntegrationTestContext } from './helpers/setup.helpers';

describe('Category (e2e)', () => {
  let ctx: IntegrationTestContext;
  let validAccessToken: string;
  let categoryDto: CreateCategoryDto;

  const userId = uuidv7();
  const categoryId = uuidv7(); // This is the category id that will be used in "not found" tests

  beforeAll(async () => {
    ctx = await createIntegrationContext();
    validAccessToken = ctx.authHelpers.getValidAccessToken(userId);
    categoryDto = ctx.categoryHelpers.defaultCategoryDto;
  });

  beforeEach(async () => {
    await ctx.resetDb();
  });

  afterAll(async () => {
    await ctx?.close();
  });

  describe('Category - /category (POST)', () => {
    it('should create a category', async () => {
      const { body } = await ctx.categoryHelpers.createCategory({
        payload: categoryDto,
        accessToken: validAccessToken,
      });

      expect(body).toMatchObject({
        id: expect.any(String) as string,
        name: categoryDto.name,
        description: categoryDto.description,
        colorCode: categoryDto.colorCode,
      });
    });

    it('should return 401 if the user is not authenticated', async () => {
      const { body } = await ctx.categoryHelpers.createCategory({
        payload: categoryDto,
        accessToken: '',
        expectedStatus: HttpStatus.UNAUTHORIZED,
      });

      expect(body).toMatchObject({
        error: 'Unauthorized',
      });
    });

    it('should return 400 if the payload is invalid', async () => {
      const { body } = await ctx.categoryHelpers.createCategory({
        payload: null,
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.BAD_REQUEST,
      });

      expect(body).toMatchObject({
        error: 'Bad Request',
      });
    });

    it('should return 400 if the payload is missing required fields', async () => {
      const invalidDto = {
        description: 'Test Description',
        colorCode: '#000000',
      };

      const { body } = await ctx.categoryHelpers.createCategory({
        payload: invalidDto,
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.BAD_REQUEST,
      });

      expect(body).toMatchObject({
        error: 'Bad Request',
      });
    });
  });

  describe('Category - /category/:id (GET)', () => {
    it('should return a category', async () => {
      const { body } = await ctx.categoryHelpers.createCategory({
        payload: categoryDto,
        accessToken: validAccessToken,
      });

      const { body: category } = await ctx.categoryHelpers.getCategory({
        id: body.id,
        accessToken: validAccessToken,
      });

      expect(category).toMatchObject({
        id: body.id,
        name: categoryDto.name,
        description: categoryDto.description,
        colorCode: categoryDto.colorCode,
      });
    });

    it('should return 401 if the user is not authenticated', async () => {
      const { body } = await ctx.categoryHelpers.getCategory({
        id: categoryId,
        accessToken: '',
        expectedStatus: HttpStatus.UNAUTHORIZED,
      });

      expect(body).toMatchObject({
        error: 'Unauthorized',
      });
    });

    it('should return 404 if the category is not found', async () => {
      const { body } = await ctx.categoryHelpers.getCategory({
        id: categoryId,
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(body).toMatchObject({
        error: 'Not Found',
      });
    });

    it('should return 404 if the category belongs to another user', async () => {
      const { body: category } = await ctx.categoryHelpers.createCategory({
        payload: categoryDto,
        accessToken: validAccessToken,
      });
      const userId2 = uuidv7();
      const validAccessToken2 = ctx.authHelpers.getValidAccessToken(userId2);

      const { body } = await ctx.categoryHelpers.getCategory({
        id: category.id,
        accessToken: validAccessToken2,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(body).toMatchObject({
        error: 'Not Found',
      });
    });

    it('should return 400 if the id is not a valid uuid v7', async () => {
      const { body } = await ctx.categoryHelpers.getCategory({
        id: 'invalid-id',
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.BAD_REQUEST,
      });

      expect(body).toMatchObject({
        error: 'Bad Request',
      });
    });
  });

  describe('Category - /category (GET)', () => {
    it('should return all categories', async () => {
      const { body: category1 } = await ctx.categoryHelpers.createCategory({
        payload: categoryDto,
        accessToken: validAccessToken,
      });
      const { body: category2 } = await ctx.categoryHelpers.createCategory({
        payload: categoryDto,
        accessToken: validAccessToken,
      });

      const { body: categories } = await ctx.categoryHelpers.getCategories({
        accessToken: validAccessToken,
      });

      expect(categories).toHaveLength(2);
      expect(categories).toContainEqual(category1);
      expect(categories).toContainEqual(category2);
    });

    it('should return an empty array if the user has no categories', async () => {
      const { body } = await ctx.categoryHelpers.getCategories({
        accessToken: validAccessToken,
      });

      expect(body).toHaveLength(0);
      expect(body).toEqual([]);
    });

    it('should return 401 if the user is not authenticated', async () => {
      const { body } = await ctx.categoryHelpers.getCategories({
        accessToken: '',
        expectedStatus: HttpStatus.UNAUTHORIZED,
      });

      expect(body).toMatchObject({
        error: 'Unauthorized',
      });
    });
  });

  describe('Category - /category/:id (PATCH)', () => {
    it('should update a category (multiple fields)', async () => {
      const { body } = await ctx.categoryHelpers.createCategory({
        payload: categoryDto,
        accessToken: validAccessToken,
      });

      const { body: createdCategory } = await ctx.categoryHelpers.getCategory({
        id: body.id,
        accessToken: validAccessToken,
      });

      expect(createdCategory).toMatchObject({
        name: categoryDto.name,
        description: categoryDto.description,
        colorCode: categoryDto.colorCode,
      });

      await ctx.categoryHelpers.updateCategory({
        id: body.id,
        payload: {
          name: 'Updated Category',
          description: 'Updated Description',
          colorCode: '#FFFFFF',
        },
        accessToken: validAccessToken,
      });

      const { body: updatedCategory } = await ctx.categoryHelpers.getCategory({
        id: body.id,
        accessToken: validAccessToken,
      });

      expect(updatedCategory).toMatchObject({
        name: 'Updated Category',
        description: 'Updated Description',
        colorCode: '#FFFFFF',
      });
    });

    it('should update a category (single field)', async () => {
      const { body } = await ctx.categoryHelpers.createCategory({
        payload: categoryDto,
        accessToken: validAccessToken,
      });

      const { body: createdCategory } = await ctx.categoryHelpers.getCategory({
        id: body.id,
        accessToken: validAccessToken,
      });

      expect(createdCategory).toMatchObject({
        name: categoryDto.name,
        description: categoryDto.description,
        colorCode: categoryDto.colorCode,
      });

      await ctx.categoryHelpers.updateCategory({
        id: body.id,
        payload: {
          name: 'Updated Category',
        },
        accessToken: validAccessToken,
      });

      const { body: updatedCategory } = await ctx.categoryHelpers.getCategory({
        id: body.id,
        accessToken: validAccessToken,
      });

      expect(updatedCategory).toMatchObject({
        name: 'Updated Category',
        description: categoryDto.description,
        colorCode: categoryDto.colorCode,
      });
    });

    it('should return 401 if the user is not authenticated', async () => {
      const { body } = await ctx.categoryHelpers.updateCategory({
        id: categoryId,
        payload: categoryDto,
        accessToken: '',
        expectedStatus: HttpStatus.UNAUTHORIZED,
      });

      expect(body).toMatchObject({
        error: 'Unauthorized',
      });
    });

    it('should return 404 if the category is not found', async () => {
      const { body } = await ctx.categoryHelpers.updateCategory({
        id: categoryId,
        payload: categoryDto,
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(body).toMatchObject({
        error: 'Not Found',
      });
    });

    it('should return 404 if the category belongs to another user', async () => {
      const { body: category } = await ctx.categoryHelpers.createCategory({
        payload: categoryDto,
        accessToken: validAccessToken,
      });
      const userId2 = uuidv7();
      const validAccessToken2 = ctx.authHelpers.getValidAccessToken(userId2);

      const { body } = await ctx.categoryHelpers.updateCategory({
        id: category.id,
        payload: categoryDto,
        accessToken: validAccessToken2,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(body).toMatchObject({
        error: 'Not Found',
      });
    });

    it('should return 400 if the id is not a valid uuid v7', async () => {
      const { body } = await ctx.categoryHelpers.updateCategory({
        id: 'invalid-id',
        payload: categoryDto,
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.BAD_REQUEST,
      });

      expect(body).toMatchObject({
        error: 'Bad Request',
      });
    });

    it('should return 400 if the payload is invalid', async () => {
      const { body: category } = await ctx.categoryHelpers.createCategory({
        payload: categoryDto,
        accessToken: validAccessToken,
      });
      const { body } = await ctx.categoryHelpers.updateCategory({
        id: category.id,
        payload: { name: 123 } as unknown as Partial<UpdateCategoryDto>,
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.BAD_REQUEST,
      });

      expect(body).toMatchObject({
        error: 'Bad Request',
      });
    });
  });

  describe('Category - /category/:id (DELETE)', () => {
    it('should delete a category', async () => {
      const { body } = await ctx.categoryHelpers.createCategory({
        payload: categoryDto,
        accessToken: validAccessToken,
      });

      const { body: createdCategory } = await ctx.categoryHelpers.getCategory({
        id: body.id,
        accessToken: validAccessToken,
      });

      expect(createdCategory).toMatchObject({
        name: categoryDto.name,
        description: categoryDto.description,
        colorCode: categoryDto.colorCode,
      });

      await ctx.categoryHelpers.deleteCategory({
        id: body.id,
        accessToken: validAccessToken,
      });

      const { body: deletedCategory } = await ctx.categoryHelpers.getCategory({
        id: body.id,
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(deletedCategory).toMatchObject({
        error: 'Not Found',
      });
    });

    it('should return 401 if the user is not authenticated', async () => {
      const { body } = await ctx.categoryHelpers.deleteCategory({
        id: categoryId,
        accessToken: '',
        expectedStatus: HttpStatus.UNAUTHORIZED,
      });

      expect(body).toMatchObject({
        error: 'Unauthorized',
      });
    });

    it('should return 404 if the category is not found', async () => {
      const { body } = await ctx.categoryHelpers.deleteCategory({
        id: categoryId,
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(body).toMatchObject({
        error: 'Not Found',
      });
    });

    it('should return 404 if the category belongs to another user', async () => {
      const { body: category } = await ctx.categoryHelpers.createCategory({
        payload: categoryDto,
        accessToken: validAccessToken,
      });
      const userId2 = uuidv7();
      const validAccessToken2 = ctx.authHelpers.getValidAccessToken(userId2);

      const { body } = await ctx.categoryHelpers.deleteCategory({
        id: category.id,
        accessToken: validAccessToken2,
        expectedStatus: HttpStatus.NOT_FOUND,
      });
      expect(body).toMatchObject({
        error: 'Not Found',
      });
    });

    it('should return 400 if the id is not a valid uuid v7', async () => {
      const { body } = await ctx.categoryHelpers.deleteCategory({
        id: 'invalid-id',
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.BAD_REQUEST,
      });

      expect(body).toMatchObject({
        error: 'Bad Request',
      });
    });
  });

  describe('Category - /category/:id/delete-impact (GET)', () => {
    it('should return the delete impact of a category (with items)', async () => {
      const { body: category } = await ctx.categoryHelpers.createCategory({
        payload: categoryDto,
        accessToken: validAccessToken,
      });
      const { body: item } = await ctx.itemHelpers.createItem({
        payload: {
          name: 'Test Item',
          description: 'Test Description',
          weight: 1,
          categoryId: category.id,
        },
        accessToken: validAccessToken,
      });

      const { body: impact } = await ctx.categoryHelpers.getCategoryDeleteImpact({
        id: category.id,
        accessToken: validAccessToken,
      });

      expect(impact).toMatchObject({
        category: {
          id: category.id,
          name: categoryDto.name,
          description: categoryDto.description,
          colorCode: categoryDto.colorCode,
        },
        items: [
          { id: item.id, name: item.name, description: item.description, weight: item.weight },
        ],
      });
    });

    it('should return the delete impact of a category (no items)', async () => {
      const { body: category } = await ctx.categoryHelpers.createCategory({
        payload: categoryDto,
        accessToken: validAccessToken,
      });

      const { body: impact } = await ctx.categoryHelpers.getCategoryDeleteImpact({
        id: category.id,
        accessToken: validAccessToken,
      });

      expect(impact).toMatchObject({
        category: {
          id: category.id,
          name: categoryDto.name,
          description: categoryDto.description,
          colorCode: categoryDto.colorCode,
        },
        items: [],
      });
    });

    it('should return 401 if the user is not authenticated', async () => {
      const { body } = await ctx.categoryHelpers.getCategoryDeleteImpact({
        id: categoryId,
        accessToken: '',
        expectedStatus: HttpStatus.UNAUTHORIZED,
      });

      expect(body).toMatchObject({
        error: 'Unauthorized',
      });
    });

    it('should return 404 if the category is not found', async () => {
      const { body } = await ctx.categoryHelpers.getCategoryDeleteImpact({
        id: categoryId,
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(body).toMatchObject({
        error: 'Not Found',
      });
    });

    it('should return 404 if the category belongs to another user', async () => {
      const { body: category } = await ctx.categoryHelpers.createCategory({
        payload: categoryDto,
        accessToken: validAccessToken,
      });
      const userId2 = uuidv7();
      const validAccessToken2 = ctx.authHelpers.getValidAccessToken(userId2);

      const { body } = await ctx.categoryHelpers.getCategoryDeleteImpact({
        id: category.id,
        accessToken: validAccessToken2,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(body).toMatchObject({
        error: 'Not Found',
      });
    });

    it('should return 400 if the id is not a valid uuid v7', async () => {
      const { body } = await ctx.categoryHelpers.getCategoryDeleteImpact({
        id: 'invalid-id',
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.BAD_REQUEST,
      });

      expect(body).toMatchObject({
        error: 'Bad Request',
      });
    });
  });
});
