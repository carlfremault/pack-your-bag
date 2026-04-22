import { HttpStatus } from '@nestjs/common';

import { v7 as uuidv7 } from 'uuid';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { ListResponseDto } from '@/modules/list/dto/list-response.dto';
import { CreatePackDto } from '@/modules/pack/dto/create-pack.dto';
import { PackSummaryResponseDto } from '@/modules/pack/dto/pack-response.dto';
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

  const userId = uuidv7();
  const packId = uuidv7(); // This is the pack id that will be used in "not found" tests

  beforeAll(async () => {
    ctx = await createIntegrationContext();
    validAccessToken = ctx.authHelpers.getValidAccessToken(userId);
    packDto = ctx.packHelpers.defaultPackDto;
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
        expect.objectContaining({ id: pack1.id, name: pack1.name, itemCount: 0, listCount: 0 }),
      );
      expect(packs).toContainEqual(
        expect.objectContaining({ id: pack2.id, name: pack2.name, itemCount: 0, listCount: 0 }),
      );
    });

    it('should return all packs (with items and lists)', async () => {
      const { pack: pack1 } = await createItemAndListInPack(ctx, validAccessToken);
      const { pack: pack2 } = await createItemAndListInPack(ctx, validAccessToken);

      const { body: packs } = await ctx.packHelpers.getPacks({
        accessToken: validAccessToken,
      });

      expect(packs).toHaveLength(2);
      expect(packs).toContainEqual(
        expect.objectContaining({
          id: pack1.id,
          name: pack1.name,
          itemCount: 1,
          listCount: 1,
        }),
      );
      expect(packs).toContainEqual(
        expect.objectContaining({
          id: pack2.id,
          name: pack2.name,
          itemCount: 1,
          listCount: 1,
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
        expect.objectContaining({ id: pack.id, name: pack.name, itemCount: 0, listCount: 0 }),
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
          itemCount: 0,
          listCount: 0,
        }) as PackSummaryResponseDto,
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
          itemCount: 0,
          listCount: 0,
        }) as PackSummaryResponseDto,
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
          itemCount: 1,
          listCount: 1,
        }) as PackSummaryResponseDto,
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
          itemCount: 0,
          listCount: 0,
        }) as PackSummaryResponseDto,
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
