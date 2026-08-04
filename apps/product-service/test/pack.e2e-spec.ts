import { HttpStatus } from '@nestjs/common';

import { v7 as uuidv7 } from 'uuid';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { ItemResponseDto, ItemWithQuantityResponseDto } from '@/common/dto/item-response.dto';
import { CategoryResponseDto } from '@/modules/category/dto/category-response.dto';
import { ListResponseDto } from '@/modules/list/dto/list-response.dto';
import { CreateAssistantPackDto } from '@/modules/pack/dto/assistant-pack.dto';
import { ClonePackDto } from '@/modules/pack/dto/clone-pack.dto';
import { CreatePackDto } from '@/modules/pack/dto/create-pack.dto';
import { PackBaseResponseDto } from '@/modules/pack/dto/pack-response.dto';
import { UpdatePackDto } from '@/modules/pack/dto/update-pack.dto';

import {
  createItemAndListInPack,
  createItemAndListInPackInTrip,
  createItemInPack,
  createListInPack,
  createMultipleItemsInPackWithQuantity,
  createMultipleListsInPackWithQuantity,
  createPackUsedInMultipleTrips,
  createPackUsedInTrip,
} from './fixtures/product.fixtures';
import { isoDateMatcher } from './helpers/matchers.helpers';
import { createIntegrationContext, IntegrationTestContext } from './helpers/setup.helpers';

describe('Pack (e2e)', () => {
  let ctx: IntegrationTestContext;
  let validAccessToken: string;
  let packDto: CreatePackDto;
  let assistantPackDto: CreateAssistantPackDto;

  const userId = uuidv7();
  const packId = uuidv7(); // This is the pack id that will be used in "not found" tests

  beforeAll(async () => {
    ctx = await createIntegrationContext();
    validAccessToken = ctx.authHelpers.getValidAccessToken(userId);
    packDto = ctx.packHelpers.defaultPackDto;
    assistantPackDto = ctx.packHelpers.defaultAssistantPackDto;
  });

  beforeEach(async () => {
    await ctx.resetDb();
  });

  afterAll(async () => {
    await ctx?.close();
  });

  describe('Pack - /pack (POST)', () => {
    it('should create a pack', async () => {
      const { body } = await ctx.packHelpers.createPack({
        payload: packDto,
        accessToken: validAccessToken,
      });

      expect(body).toMatchObject({
        id: expect.any(String) as string,
        name: packDto.name,
        description: packDto.description,
        colorTheme: packDto.colorTheme,
        createdAt: isoDateMatcher,
        updatedAt: isoDateMatcher,
      });
    });

    it('should return 401 if the user is not authenticated', async () => {
      const { body } = await ctx.packHelpers.createPack({
        payload: packDto,
        accessToken: '',
        expectedStatus: HttpStatus.UNAUTHORIZED,
      });

      expect(body).toMatchObject({
        error: 'Unauthorized',
      });
    });

    it('should return 400 if the payload is invalid', async () => {
      const { body } = await ctx.packHelpers.createPack({
        payload: { name: 123 } as unknown as Partial<CreatePackDto>,
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.BAD_REQUEST,
      });

      expect(body).toMatchObject({
        error: 'Bad Request',
      });
    });

    it('should return 400 if the payload is missing required fields', async () => {
      const { body } = await ctx.packHelpers.createPack({
        payload: { description: 'Test Description', colorTheme: 'slate' },
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.BAD_REQUEST,
      });

      expect(body).toMatchObject({
        error: 'Bad Request',
      });
    });
  });

  describe('Pack - /pack/assistant (POST)', () => {
    it('should create a pack', async () => {
      const { body } = await ctx.packHelpers.createAssistantPack({
        payload: assistantPackDto,
        accessToken: validAccessToken,
      });

      expect(body).toMatchObject({
        id: expect.any(String) as string,
        name: assistantPackDto.packName,
        createdAt: isoDateMatcher,
        updatedAt: isoDateMatcher,
      });
    });

    it('should create items and attach them to the pack with the given quantity', async () => {
      const { body } = await ctx.packHelpers.createAssistantPack({
        payload: assistantPackDto,
        accessToken: validAccessToken,
      });

      const { body: createdPack } = await ctx.packHelpers.getPack({
        id: body.id,
        accessToken: validAccessToken,
      });

      expect(createdPack.items).toHaveLength(2);
      expect(createdPack.items).toContainEqual(
        expect.objectContaining({
          quantity: 2,
          item: expect.objectContaining({ name: 'Item 1' }) as Record<string, unknown>,
        }),
      );
      expect(createdPack.items).toContainEqual(
        expect.objectContaining({
          quantity: 3,
          item: expect.objectContaining({ name: 'Item 2' }) as Record<string, unknown>,
        }),
      );
    });

    it('should create a category for each item that has one', async () => {
      const { body } = await ctx.packHelpers.createAssistantPack({
        payload: assistantPackDto,
        accessToken: validAccessToken,
      });

      const { body: createdPack } = await ctx.packHelpers.getPack({
        id: body.id,
        accessToken: validAccessToken,
      });

      expect(createdPack.items).toContainEqual(
        expect.objectContaining({
          item: expect.objectContaining({
            category: expect.objectContaining({
              name: 'category 1',
              colorTheme: 'slate',
            }) as CategoryResponseDto,
          }) as ItemResponseDto,
        }),
      );
      expect(createdPack.items).toContainEqual(
        expect.objectContaining({
          item: expect.objectContaining({
            category: expect.objectContaining({
              name: 'category 2',
              colorTheme: 'slate',
            }) as CategoryResponseDto,
          }) as ItemResponseDto,
        }),
      );

      const categories = await ctx.prisma.category.findMany({ where: { userId } });
      expect(categories).toHaveLength(2);
    });

    it('should reuse an existing category instead of creating a duplicate', async () => {
      const existingCategory = await ctx.prisma.category.create({
        data: { id: uuidv7(), name: 'category 1', colorTheme: 'teal', userId },
      });

      const { body } = await ctx.packHelpers.createAssistantPack({
        payload: assistantPackDto,
        accessToken: validAccessToken,
      });

      const { body: createdPack } = await ctx.packHelpers.getPack({
        id: body.id,
        accessToken: validAccessToken,
      });

      expect(createdPack.items).toContainEqual(
        expect.objectContaining({
          item: expect.objectContaining({
            category: expect.objectContaining({
              id: existingCategory.id,
              name: 'category 1',
              colorTheme: 'teal',
            }) as CategoryResponseDto,
          }) as ItemResponseDto,
        }),
      );

      const categories = await ctx.prisma.category.findMany({
        where: { userId, name: 'category 1' },
      });
      expect(categories).toHaveLength(1);
    });

    it('should only create one category when multiple items share the same category name', async () => {
      const { body } = await ctx.packHelpers.createAssistantPack({
        payload: {
          packName: 'Shared Category Pack',
          items: [
            { name: 'Item A', quantity: 1, category: { name: 'Shared', colorTheme: 'slate' } },
            { name: 'Item B', quantity: 1, category: { name: 'Shared', colorTheme: 'slate' } },
          ],
        },
        accessToken: validAccessToken,
      });

      const { body: createdPack } = await ctx.packHelpers.getPack({
        id: body.id,
        accessToken: validAccessToken,
      });

      const categories = await ctx.prisma.category.findMany({
        where: { userId, name: 'shared' },
      });
      expect(categories).toHaveLength(1);

      const [itemA, itemB] = createdPack.items as ItemWithQuantityResponseDto[];
      expect(itemA).toBeDefined();
      expect(itemB).toBeDefined();
      expect(itemA!.item.category?.id).toBe(itemB!.item.category?.id);
    });

    it('should store the item note as its description', async () => {
      const { body } = await ctx.packHelpers.createAssistantPack({
        payload: {
          packName: 'Note Pack',
          items: [
            {
              name: 'Item With Note',
              quantity: 1,
              note: 'Pack this last',
              category: { name: 'Category', colorTheme: 'slate' },
            },
          ],
        },
        accessToken: validAccessToken,
      });

      const { body: createdPack } = await ctx.packHelpers.getPack({
        id: body.id,
        accessToken: validAccessToken,
      });

      expect(createdPack.items).toContainEqual(
        expect.objectContaining({
          item: expect.objectContaining({
            name: 'Item With Note',
            description: 'Pack this last',
          }) as Record<string, unknown>,
        }),
      );
    });

    it('should return 401 if the user is not authenticated', async () => {
      const { body } = await ctx.packHelpers.createAssistantPack({
        payload: assistantPackDto,
        accessToken: '',
        expectedStatus: HttpStatus.UNAUTHORIZED,
      });

      expect(body).toMatchObject({
        error: 'Unauthorized',
      });
    });

    it('should return 400 if the payload is invalid', async () => {
      const { body } = await ctx.packHelpers.createAssistantPack({
        payload: { packName: 123 } as unknown as Partial<CreateAssistantPackDto>,
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.BAD_REQUEST,
      });

      expect(body).toMatchObject({
        error: 'Bad Request',
      });
    });

    it('should return 400 if the payload is missing required fields', async () => {
      const { body } = await ctx.packHelpers.createAssistantPack({
        payload: {} as Partial<CreateAssistantPackDto>,
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.BAD_REQUEST,
      });

      expect(body).toMatchObject({
        error: 'Bad Request',
      });
    });
  });

  describe('Pack - /pack/:id (GET)', () => {
    it('should return a pack', async () => {
      const { body } = await ctx.packHelpers.createPack({
        payload: packDto,
        accessToken: validAccessToken,
      });

      const { body: createdPack } = await ctx.packHelpers.getPack({
        id: body.id,
        accessToken: validAccessToken,
      });

      expect(createdPack).toMatchObject({
        id: body.id,
        name: packDto.name,
        description: packDto.description,
        colorTheme: packDto.colorTheme,
        createdAt: isoDateMatcher,
        updatedAt: isoDateMatcher,
      });
    });

    it('should return a pack with its items', async () => {
      const { pack, item } = await createItemInPack(ctx, validAccessToken);

      const { body: createdPack } = await ctx.packHelpers.getPack({
        id: pack.id,
        accessToken: validAccessToken,
      });

      expect(createdPack).toMatchObject({
        id: pack.id,
        name: pack.name,
        description: pack.description,
        colorTheme: pack.colorTheme,
        createdAt: isoDateMatcher,
        updatedAt: isoDateMatcher,
        items: [{ quantity: 1, item }],
      });
    });

    it('should return a pack with its items with quantity', async () => {
      const { pack, item1, item2 } = await createMultipleItemsInPackWithQuantity(
        ctx,
        validAccessToken,
        2,
      );

      const { body: createdPack } = await ctx.packHelpers.getPack({
        id: pack.id,
        accessToken: validAccessToken,
      });

      expect(createdPack).toMatchObject({
        id: pack.id,
        name: pack.name,
        description: pack.description,
        colorTheme: pack.colorTheme,
        createdAt: isoDateMatcher,
        updatedAt: isoDateMatcher,
      });
      expect(createdPack.items).toHaveLength(2);
      expect(createdPack.items).toContainEqual({ quantity: 2, item: item1 });
      expect(createdPack.items).toContainEqual({ quantity: 2, item: item2 });
    });

    it('should return a pack with its lists', async () => {
      const { pack, list } = await createListInPack(ctx, validAccessToken);

      const { body: createdPack } = await ctx.packHelpers.getPack({
        id: pack.id,
        accessToken: validAccessToken,
      });

      expect(createdPack).toMatchObject({
        id: pack.id,
        name: pack.name,
        description: pack.description,
        colorTheme: pack.colorTheme,
        createdAt: isoDateMatcher,
        updatedAt: isoDateMatcher,
        lists: [{ quantity: 1, list }],
      });
    });

    it('should return a pack with its lists with quantity', async () => {
      const { pack, list1, list2 } = await createMultipleListsInPackWithQuantity(
        ctx,
        validAccessToken,
        2,
      );

      const { body: createdPack } = await ctx.packHelpers.getPack({
        id: pack.id,
        accessToken: validAccessToken,
      });

      expect(createdPack).toMatchObject({
        id: pack.id,
        name: pack.name,
        description: pack.description,
        colorTheme: pack.colorTheme,
        createdAt: isoDateMatcher,
        updatedAt: isoDateMatcher,
      });
      expect(createdPack.lists).toHaveLength(2);
      expect(createdPack.lists).toContainEqual({
        quantity: 2,
        list: expect.objectContaining({
          id: list1.id,
          name: list1.name,
          description: list1.description,
          colorTheme: list1.colorTheme,
          createdAt: isoDateMatcher,
          updatedAt: isoDateMatcher,
        }) as ListResponseDto,
      });
      expect(createdPack.lists).toContainEqual({
        quantity: 2,
        list: expect.objectContaining({
          id: list2.id,
          name: list2.name,
          description: list2.description,
          colorTheme: list2.colorTheme,
          createdAt: isoDateMatcher,
          updatedAt: isoDateMatcher,
        }) as ListResponseDto,
      });
    });

    it('should return a pack with its items and lists', async () => {
      const { pack, item, list } = await createItemAndListInPack(ctx, validAccessToken);

      const { body: createdPack } = await ctx.packHelpers.getPack({
        id: pack.id,
        accessToken: validAccessToken,
      });

      expect(createdPack).toMatchObject({
        id: pack.id,
        name: pack.name,
        description: pack.description,
        colorTheme: pack.colorTheme,
        createdAt: isoDateMatcher,
        updatedAt: isoDateMatcher,
        items: [{ quantity: 1, item }],
        lists: [{ quantity: 1, list }],
      });
    });

    it('should return 401 if the user is not authenticated', async () => {
      const { body } = await ctx.packHelpers.getPack({
        id: packId,
        accessToken: '',
        expectedStatus: HttpStatus.UNAUTHORIZED,
      });

      expect(body).toMatchObject({
        error: 'Unauthorized',
      });
    });

    it('should return 404 if the pack is not found', async () => {
      const { body } = await ctx.packHelpers.getPack({
        id: packId,
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(body).toMatchObject({
        error: 'Not Found',
      });
    });

    it('should return 404 if the pack belongs to another user', async () => {
      const { body: pack } = await ctx.packHelpers.createPack({
        payload: packDto,
        accessToken: validAccessToken,
      });
      const userId2 = uuidv7();
      const validAccessToken2 = ctx.authHelpers.getValidAccessToken(userId2);

      const { body } = await ctx.packHelpers.getPack({
        id: pack.id,
        accessToken: validAccessToken2,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(body).toMatchObject({
        error: 'Not Found',
      });
    });

    it('should return 400 if the id is not a valid uuid v7', async () => {
      const { body } = await ctx.packHelpers.getPack({
        id: 'invalid-uuid',
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.BAD_REQUEST,
      });

      expect(body).toMatchObject({
        error: 'Bad Request',
      });
    });
  });

  describe('Pack - /pack (GET)', () => {
    it('should return all packs (empty packs)', async () => {
      const { body: pack1 } = await ctx.packHelpers.createPack({
        payload: packDto,
        accessToken: validAccessToken,
      });
      const { body: pack2 } = await ctx.packHelpers.createPack({
        payload: packDto,
        accessToken: validAccessToken,
      });

      const { body: packs } = await ctx.packHelpers.getPacks({
        accessToken: validAccessToken,
      });

      expect(packs).toHaveLength(2);
      expect(packs).toContainEqual(
        expect.objectContaining({
          id: pack1.id,
          name: pack1.name,
          itemCount: 0,
          totalWeight: 0,
        }),
      );
      expect(packs).toContainEqual(
        expect.objectContaining({
          id: pack2.id,
          name: pack2.name,
          itemCount: 0,
          totalWeight: 0,
        }),
      );
    });

    it('should return all packs (with items and lists)', async () => {
      const { pack: pack1 } = await createItemAndListInPack(ctx, validAccessToken);
      const { pack: pack2 } = await createItemAndListInPack(ctx, validAccessToken);

      const { body: packs } = await ctx.packHelpers.getPacks({
        accessToken: validAccessToken,
      });

      expect(packs).toHaveLength(2);
      // 1 direct item (weight=1, qty=1), 1 empty list (qty=1) → itemCount:1, totalWeight:1
      expect(packs).toContainEqual(
        expect.objectContaining({
          id: pack1.id,
          name: pack1.name,
          itemCount: 1,
          totalWeight: 1,
        }),
      );
      expect(packs).toContainEqual(
        expect.objectContaining({
          id: pack2.id,
          name: pack2.name,
          itemCount: 1,
          totalWeight: 1,
        }),
      );
    });

    it('should return an empty array if the user has no packs', async () => {
      const { body } = await ctx.packHelpers.getPacks({
        accessToken: validAccessToken,
      });

      expect(body).toEqual([]);
    });

    it('should only return packs belonging to the authenticated user', async () => {
      const { body: pack } = await ctx.packHelpers.createPack({
        payload: packDto,
        accessToken: validAccessToken,
      });
      const userId2 = uuidv7();
      const validAccessToken2 = ctx.authHelpers.getValidAccessToken(userId2);

      const { body: packsUser1 } = await ctx.packHelpers.getPacks({
        accessToken: validAccessToken,
      });
      const { body: packsUser2 } = await ctx.packHelpers.getPacks({
        accessToken: validAccessToken2,
      });

      expect(packsUser1).toHaveLength(1);
      expect(packsUser1).toContainEqual(
        expect.objectContaining({ id: pack.id, name: pack.name, itemCount: 0, totalWeight: 0 }),
      );

      expect(packsUser2).toEqual([]);
    });

    it('should return 401 if the user is not authenticated', async () => {
      const { body } = await ctx.packHelpers.getPacks({
        accessToken: '',
        expectedStatus: HttpStatus.UNAUTHORIZED,
      });

      expect(body).toMatchObject({ error: 'Unauthorized' });
    });
  });

  describe('Pack - /pack/:id (PATCH)', () => {
    it('should update a pack (all fields)', async () => {
      const { body: pack } = await ctx.packHelpers.createPack({
        payload: packDto,
        accessToken: validAccessToken,
      });

      const { body: createdPack } = await ctx.packHelpers.getPack({
        id: pack.id,
        accessToken: validAccessToken,
      });

      expect(createdPack).toMatchObject({
        name: packDto.name,
        description: packDto.description,
        colorTheme: packDto.colorTheme,
        createdAt: isoDateMatcher,
        updatedAt: isoDateMatcher,
      });

      await ctx.packHelpers.updatePack({
        id: pack.id,
        payload: {
          name: 'Updated Pack',
          description: 'Updated Description',
          colorTheme: 'slate',
        },
        accessToken: validAccessToken,
      });

      const { body: updatedPack } = await ctx.packHelpers.getPack({
        id: pack.id,
        accessToken: validAccessToken,
      });

      expect(updatedPack).toMatchObject({
        name: 'Updated Pack',
        description: 'Updated Description',
        colorTheme: 'slate',
        createdAt: isoDateMatcher,
        updatedAt: isoDateMatcher,
      });
    });

    it('should update a pack (single field)', async () => {
      const { body: pack } = await ctx.packHelpers.createPack({
        payload: packDto,
        accessToken: validAccessToken,
      });

      const { body: createdPack } = await ctx.packHelpers.getPack({
        id: pack.id,
        accessToken: validAccessToken,
      });

      expect(createdPack).toMatchObject({
        name: packDto.name,
        description: packDto.description,
        colorTheme: packDto.colorTheme,
        createdAt: isoDateMatcher,
        updatedAt: isoDateMatcher,
      });

      await ctx.packHelpers.updatePack({
        id: pack.id,
        payload: { name: 'Updated Pack' },
        accessToken: validAccessToken,
      });

      const { body: updatedPack } = await ctx.packHelpers.getPack({
        id: pack.id,
        accessToken: validAccessToken,
      });

      expect(updatedPack).toMatchObject({
        name: 'Updated Pack',
        description: packDto.description,
        colorTheme: packDto.colorTheme,
        createdAt: isoDateMatcher,
        updatedAt: isoDateMatcher,
      });
    });

    it('should return 401 if the user is not authenticated', async () => {
      const { body } = await ctx.packHelpers.updatePack({
        id: packId,
        payload: { name: 'Updated Pack' },
        accessToken: '',
        expectedStatus: HttpStatus.UNAUTHORIZED,
      });

      expect(body).toMatchObject({ error: 'Unauthorized' });
    });

    it('should return 404 if the pack is not found', async () => {
      const { body } = await ctx.packHelpers.updatePack({
        id: packId,
        payload: { name: 'Updated Pack' },
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(body).toMatchObject({ error: 'Not Found' });
    });

    it('should return 404 if the pack belongs to another user', async () => {
      const { body: pack } = await ctx.packHelpers.createPack({
        payload: packDto,
        accessToken: validAccessToken,
      });
      const userId2 = uuidv7();
      const validAccessToken2 = ctx.authHelpers.getValidAccessToken(userId2);

      const { body } = await ctx.packHelpers.updatePack({
        id: pack.id,
        payload: { name: 'Updated Pack' },
        accessToken: validAccessToken2,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(body).toMatchObject({ error: 'Not Found' });
    });

    it('should return 400 if the id is not a valid uuid v7', async () => {
      const { body } = await ctx.packHelpers.updatePack({
        id: 'invalid-uuid',
        payload: { name: 'Updated Pack' },
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.BAD_REQUEST,
      });

      expect(body).toMatchObject({ error: 'Bad Request' });
    });

    it('should return 400 if the payload is invalid', async () => {
      const { body: pack } = await ctx.packHelpers.createPack({
        payload: packDto,
        accessToken: validAccessToken,
      });

      const { body } = await ctx.packHelpers.updatePack({
        id: pack.id,
        payload: { name: 123 } as unknown as Partial<UpdatePackDto>,
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.BAD_REQUEST,
      });

      expect(body).toMatchObject({ error: 'Bad Request' });
    });
  });

  describe('Pack - /pack/:id (DELETE)', () => {
    it('should delete a pack, not on any trip', async () => {
      const { body: pack } = await ctx.packHelpers.createPack({
        payload: packDto,
        accessToken: validAccessToken,
      });

      await ctx.packHelpers.deletePack({
        id: pack.id,
        accessToken: validAccessToken,
      });

      const { body: deletedPack } = await ctx.packHelpers.getPack({
        id: pack.id,
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(deletedPack).toMatchObject({ error: 'Not Found' });
    });

    it('should delete a pack, used on a trip', async () => {
      const { pack, trip } = await createPackUsedInTrip(ctx, validAccessToken);

      const { body: createdTrip } = await ctx.tripHelpers.getTrip({
        id: trip.id,
        accessToken: validAccessToken,
      });

      expect(createdTrip).toMatchObject({
        pack: { id: pack.id },
      });

      await ctx.packHelpers.deletePack({
        id: pack.id,
        accessToken: validAccessToken,
      });

      const { body: deletedPack } = await ctx.packHelpers.getPack({
        id: pack.id,
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(deletedPack).toMatchObject({ error: 'Not Found' });

      const { body: tripAfterPackDeletion } = await ctx.tripHelpers.getTrip({
        id: trip.id,
        accessToken: validAccessToken,
      });

      expect(tripAfterPackDeletion).toMatchObject({
        pack: null,
      });
    });

    it('should delete a pack, with items and lists', async () => {
      const { pack, item, list, itemPack, listPack } = await createItemAndListInPack(
        ctx,
        validAccessToken,
      );

      const { body: createdPack } = await ctx.packHelpers.getPack({
        id: pack.id,
        accessToken: validAccessToken,
      });

      expect(createdPack).toMatchObject({
        id: pack.id,
        name: pack.name,
        description: pack.description,
        colorTheme: pack.colorTheme,
        createdAt: isoDateMatcher,
        updatedAt: isoDateMatcher,
        items: [{ quantity: 1, item }],
        lists: [{ quantity: 1, list }],
      });

      const itemPacksBeforeDeletion = await ctx.prisma.itemPack.findMany({
        where: {
          packId: pack.id,
        },
      });

      const listPacksBeforeDeletion = await ctx.prisma.listPack.findMany({
        where: {
          packId: pack.id,
        },
      });

      expect(itemPacksBeforeDeletion).toHaveLength(1);
      expect(itemPacksBeforeDeletion).toContainEqual(itemPack);
      expect(listPacksBeforeDeletion).toHaveLength(1);
      expect(listPacksBeforeDeletion).toContainEqual(listPack);

      await ctx.packHelpers.deletePack({
        id: pack.id,
        accessToken: validAccessToken,
      });

      const { body: deletedPack } = await ctx.packHelpers.getPack({
        id: pack.id,
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(deletedPack).toMatchObject({ error: 'Not Found' });

      const itemPacksAfterDeletion = await ctx.prisma.itemPack.findMany({
        where: {
          packId: pack.id,
        },
      });

      const listPacksAfterDeletion = await ctx.prisma.listPack.findMany({
        where: {
          packId: pack.id,
        },
      });

      expect(itemPacksAfterDeletion).toHaveLength(0);
      expect(listPacksAfterDeletion).toHaveLength(0);

      const { body: itemAfterDeletion } = await ctx.itemHelpers.getItem({
        id: item.id,
        accessToken: validAccessToken,
      });
      expect(itemAfterDeletion.id).toBe(item.id);

      const { body: listAfterDeletion } = await ctx.listHelpers.getList({
        id: list.id,
        accessToken: validAccessToken,
      });
      expect(listAfterDeletion.id).toBe(list.id);
    });

    it('should return 401 if the user is not authenticated', async () => {
      const { body } = await ctx.packHelpers.deletePack({
        id: packId,
        accessToken: '',
        expectedStatus: HttpStatus.UNAUTHORIZED,
      });

      expect(body).toMatchObject({ error: 'Unauthorized' });
    });

    it('should return 404 if the pack is not found', async () => {
      const { body } = await ctx.packHelpers.deletePack({
        id: packId,
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(body).toMatchObject({ error: 'Not Found' });
    });

    it('should return 404 if the pack belongs to another user', async () => {
      const { body: pack } = await ctx.packHelpers.createPack({
        payload: packDto,
        accessToken: validAccessToken,
      });
      const userId2 = uuidv7();
      const validAccessToken2 = ctx.authHelpers.getValidAccessToken(userId2);

      const { body } = await ctx.packHelpers.deletePack({
        id: pack.id,
        accessToken: validAccessToken2,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(body).toMatchObject({ error: 'Not Found' });
    });

    it('should return 400 if the id is not a valid uuid v7', async () => {
      const { body } = await ctx.packHelpers.deletePack({
        id: 'invalid-uuid',
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.BAD_REQUEST,
      });

      expect(body).toMatchObject({ error: 'Bad Request' });
    });
  });

  describe('Pack - /pack/:id/clone (POST)', () => {
    const cloneName = 'Cloned Pack';

    it('should clone an empty pack', async () => {
      const { body: pack } = await ctx.packHelpers.createPack({
        payload: packDto,
        accessToken: validAccessToken,
      });

      const { body: clonedPack } = await ctx.packHelpers.clonePack({
        id: pack.id,
        payload: { newName: cloneName },
        accessToken: validAccessToken,
      });

      expect(clonedPack).toMatchObject({
        id: expect.any(String) as string,
        name: cloneName,
        description: pack.description,
        colorTheme: pack.colorTheme,
        createdAt: isoDateMatcher,
        updatedAt: isoDateMatcher,
      });
      expect(clonedPack.id).not.toBe(pack.id);
      expect(clonedPack.createdAt).not.toBe(pack.createdAt);
    });

    it('should clone a pack with its items', async () => {
      const { pack, item } = await createItemInPack(ctx, validAccessToken);

      const { body: clonedPack } = await ctx.packHelpers.clonePack({
        id: pack.id,
        payload: { newName: cloneName },
        accessToken: validAccessToken,
      });

      const { body: fetchedClone } = await ctx.packHelpers.getPack({
        id: clonedPack.id,
        accessToken: validAccessToken,
      });

      expect(fetchedClone).toMatchObject({
        items: [{ quantity: 1, item }],
      });
    });

    it('should clone a pack with its lists', async () => {
      const { pack, list } = await createListInPack(ctx, validAccessToken);

      const { body: clonedPack } = await ctx.packHelpers.clonePack({
        id: pack.id,
        payload: { newName: cloneName },
        accessToken: validAccessToken,
      });

      const { body: fetchedClone } = await ctx.packHelpers.getPack({
        id: clonedPack.id,
        accessToken: validAccessToken,
      });

      expect(fetchedClone).toMatchObject({
        lists: [{ quantity: 1, list }],
      });
    });

    it('should clone a pack with its items and lists', async () => {
      const { pack, item, list } = await createItemAndListInPack(ctx, validAccessToken);

      const { body: clonedPack } = await ctx.packHelpers.clonePack({
        id: pack.id,
        payload: { newName: cloneName },
        accessToken: validAccessToken,
      });

      const { body: fetchedClone } = await ctx.packHelpers.getPack({
        id: clonedPack.id,
        accessToken: validAccessToken,
      });

      expect(fetchedClone).toMatchObject({
        items: [{ quantity: 1, item }],
        lists: [{ quantity: 1, list }],
      });
    });

    it('should preserve item quantities when cloning', async () => {
      const { pack, item1, item2 } = await createMultipleItemsInPackWithQuantity(
        ctx,
        validAccessToken,
        3,
      );

      const { body: clonedPack } = await ctx.packHelpers.clonePack({
        id: pack.id,
        payload: { newName: cloneName },
        accessToken: validAccessToken,
      });

      const { body: fetchedClone } = await ctx.packHelpers.getPack({
        id: clonedPack.id,
        accessToken: validAccessToken,
      });

      expect(fetchedClone.items).toHaveLength(2);
      expect(fetchedClone.items).toContainEqual(
        expect.objectContaining({
          quantity: 3,
          item: expect.objectContaining({ id: item1.id }) as Record<string, unknown>,
        }),
      );
      expect(fetchedClone.items).toContainEqual(
        expect.objectContaining({
          quantity: 3,
          item: expect.objectContaining({ id: item2.id }) as Record<string, unknown>,
        }),
      );
    });

    it('should not affect the original pack', async () => {
      const { pack, item } = await createItemInPack(ctx, validAccessToken);

      await ctx.packHelpers.clonePack({
        id: pack.id,
        payload: { newName: cloneName },
        accessToken: validAccessToken,
      });

      const { body: originalPack } = await ctx.packHelpers.getPack({
        id: pack.id,
        accessToken: validAccessToken,
      });

      expect(originalPack).toMatchObject({
        id: pack.id,
        name: pack.name,
        items: [
          {
            quantity: 1,
            item: expect.objectContaining({ id: item.id }) as Record<string, unknown>,
          },
        ],
      });
    });

    it('should return 401 if the user is not authenticated', async () => {
      const { body } = await ctx.packHelpers.clonePack({
        id: packId,
        payload: { newName: cloneName },
        accessToken: '',
        expectedStatus: HttpStatus.UNAUTHORIZED,
      });

      expect(body).toMatchObject({ error: 'Unauthorized' });
    });

    it('should return 404 if the pack is not found', async () => {
      const { body } = await ctx.packHelpers.clonePack({
        id: packId,
        payload: { newName: cloneName },
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(body).toMatchObject({ error: 'Not Found' });
    });

    it('should return 404 if the pack belongs to another user', async () => {
      const { body: pack } = await ctx.packHelpers.createPack({
        payload: packDto,
        accessToken: validAccessToken,
      });
      const userId2 = uuidv7();
      const validAccessToken2 = ctx.authHelpers.getValidAccessToken(userId2);

      const { body } = await ctx.packHelpers.clonePack({
        id: pack.id,
        payload: { newName: cloneName },
        accessToken: validAccessToken2,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(body).toMatchObject({ error: 'Not Found' });
    });

    it('should return 400 if the id is not a valid uuid v7', async () => {
      const { body } = await ctx.packHelpers.clonePack({
        id: 'invalid-uuid',
        payload: { newName: cloneName },
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.BAD_REQUEST,
      });

      expect(body).toMatchObject({ error: 'Bad Request' });
    });

    it('should return 400 if the payload is invalid', async () => {
      const { body: pack } = await ctx.packHelpers.createPack({
        payload: packDto,
        accessToken: validAccessToken,
      });

      const { body } = await ctx.packHelpers.clonePack({
        id: pack.id,
        payload: { newName: 123 } as unknown as Partial<ClonePackDto>,
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.BAD_REQUEST,
      });

      expect(body).toMatchObject({ error: 'Bad Request' });
    });

    it('should return 400 if the payload is missing required fields', async () => {
      const { body: pack } = await ctx.packHelpers.createPack({
        payload: packDto,
        accessToken: validAccessToken,
      });

      const { body } = await ctx.packHelpers.clonePack({
        id: pack.id,
        payload: {} as Partial<ClonePackDto>,
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.BAD_REQUEST,
      });

      expect(body).toMatchObject({ error: 'Bad Request' });
    });
  });

  describe('Pack - /pack/:id/delete-impact (GET)', () => {
    it('should return the delete impact of a pack, not on any trip', async () => {
      const { body: pack } = await ctx.packHelpers.createPack({
        payload: packDto,
        accessToken: validAccessToken,
      });

      const { body: impact } = await ctx.packHelpers.getPackDeleteImpact({
        id: pack.id,
        accessToken: validAccessToken,
      });

      expect(impact).toMatchObject({
        pack: expect.objectContaining({
          id: pack.id,
          name: pack.name,
          description: pack.description,
          colorTheme: pack.colorTheme,
          createdAt: isoDateMatcher,
          updatedAt: isoDateMatcher,
        }) as PackBaseResponseDto,
        trips: [],
      });
    });

    it('should return the delete impact of a pack, used on a trip', async () => {
      const { pack, trip } = await createPackUsedInTrip(ctx, validAccessToken);

      const { body: impact } = await ctx.packHelpers.getPackDeleteImpact({
        id: pack.id,
        accessToken: validAccessToken,
      });

      expect(impact).toMatchObject({
        pack: expect.objectContaining({
          id: pack.id,
          name: pack.name,
          description: pack.description,
          colorTheme: pack.colorTheme,
          createdAt: isoDateMatcher,
          updatedAt: isoDateMatcher,
        }) as PackBaseResponseDto,
        trips: [{ id: trip.id, name: trip.name, date: trip.date, remarks: trip.remarks }],
      });
    });

    it('should return the delete impact of a pack, with items and lists, used on a trip', async () => {
      const { pack, trip } = await createItemAndListInPackInTrip(ctx, validAccessToken);

      const { body: impact } = await ctx.packHelpers.getPackDeleteImpact({
        id: pack.id,
        accessToken: validAccessToken,
      });

      expect(impact).toMatchObject({
        pack: expect.objectContaining({
          id: pack.id,
          name: pack.name,
          description: pack.description,
          colorTheme: pack.colorTheme,
          createdAt: isoDateMatcher,
          updatedAt: isoDateMatcher,
        }) as PackBaseResponseDto,
        trips: [{ id: trip.id, name: trip.name, date: trip.date, remarks: trip.remarks }],
      });
    });

    it('should return the delete impact of a pack used in multiple trips', async () => {
      const { pack, trip1, trip2 } = await createPackUsedInMultipleTrips(ctx, validAccessToken);

      const { body: impact } = await ctx.packHelpers.getPackDeleteImpact({
        id: pack.id,
        accessToken: validAccessToken,
      });

      expect(impact).toMatchObject({
        pack: expect.objectContaining({
          id: pack.id,
          name: pack.name,
          description: pack.description,
          colorTheme: pack.colorTheme,
          createdAt: isoDateMatcher,
          updatedAt: isoDateMatcher,
        }) as PackBaseResponseDto,
      });
      expect(impact.trips).toHaveLength(2);
      expect(impact.trips).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: trip1.id,
            name: trip1.name,
            date: trip1.date,
            remarks: trip1.remarks,
          }),
          expect.objectContaining({
            id: trip2.id,
            name: trip2.name,
            date: trip2.date,
            remarks: trip2.remarks,
          }),
        ]),
      );
    });

    it('should return 401 if the user is not authenticated', async () => {
      const { body } = await ctx.packHelpers.getPackDeleteImpact({
        id: packId,
        accessToken: '',
        expectedStatus: HttpStatus.UNAUTHORIZED,
      });

      expect(body).toMatchObject({ error: 'Unauthorized' });
    });

    it('should return 404 if the pack is not found', async () => {
      const { body } = await ctx.packHelpers.getPackDeleteImpact({
        id: packId,
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(body).toMatchObject({ error: 'Not Found' });
    });

    it('should return 404 if the pack belongs to another user', async () => {
      const { body: pack } = await ctx.packHelpers.createPack({
        payload: packDto,
        accessToken: validAccessToken,
      });
      const userId2 = uuidv7();
      const validAccessToken2 = ctx.authHelpers.getValidAccessToken(userId2);

      const { body } = await ctx.packHelpers.getPackDeleteImpact({
        id: pack.id,
        accessToken: validAccessToken2,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(body).toMatchObject({ error: 'Not Found' });
    });

    it('should return 400 if the id is not a valid uuid v7', async () => {
      const { body } = await ctx.packHelpers.getPackDeleteImpact({
        id: 'invalid-uuid',
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.BAD_REQUEST,
      });

      expect(body).toMatchObject({ error: 'Bad Request' });
    });
  });
});
