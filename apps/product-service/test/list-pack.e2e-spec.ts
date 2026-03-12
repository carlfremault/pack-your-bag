import { HttpStatus } from '@nestjs/common';

import { v7 as uuidv7 } from 'uuid';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createIntegrationContext, IntegrationTestContext } from './helpers/setup.helpers';
describe('ListPack (e2e)', () => {
  let ctx: IntegrationTestContext;
  let validAccessToken: string;

  const userId = uuidv7();

  beforeAll(async () => {
    ctx = await createIntegrationContext();
    validAccessToken = ctx.authHelpers.getValidAccessToken(userId);
  });

  beforeEach(async () => {
    await ctx.resetDb();
  });

  afterAll(async () => {
    await ctx?.close();
  });

  describe('ListPack - /list-pack (POST)', () => {
    it('should upsert a list in a pack (create path)', async () => {
      const { body: list } = await ctx.listHelpers.createList({
        payload: ctx.listHelpers.defaultListDto,
        accessToken: validAccessToken,
      });
      const { body: pack } = await ctx.packHelpers.createPack({
        payload: ctx.packHelpers.defaultPackDto,
        accessToken: validAccessToken,
      });

      const { body: listPack } = await ctx.listPackHelpers.upsertListInPack({
        payload: { listId: list.id, packId: pack.id, quantity: 1 },
        accessToken: validAccessToken,
      });

      expect(listPack).toMatchObject({
        listId: list.id,
        packId: pack.id,
        quantity: 1,
      });
    });

    it('should upsert a list in a pack (update path)', async () => {
      const { body: list } = await ctx.listHelpers.createList({
        payload: ctx.listHelpers.defaultListDto,
        accessToken: validAccessToken,
      });
      const { body: pack } = await ctx.packHelpers.createPack({
        payload: ctx.packHelpers.defaultPackDto,
        accessToken: validAccessToken,
      });

      const { body: listPack } = await ctx.listPackHelpers.upsertListInPack({
        payload: { listId: list.id, packId: pack.id, quantity: 1 },
        accessToken: validAccessToken,
      });

      expect(listPack).toMatchObject({
        listId: list.id,
        packId: pack.id,
        quantity: 1,
      });

      const { body: updatedListPack } = await ctx.listPackHelpers.upsertListInPack({
        payload: { listId: list.id, packId: pack.id, quantity: 2 },
        accessToken: validAccessToken,
      });

      expect(updatedListPack).toMatchObject({
        listId: list.id,
        packId: pack.id,
        quantity: 2,
      });
    });

    it('should return 404 if the list is not found', async () => {
      const { body: pack } = await ctx.packHelpers.createPack({
        payload: ctx.packHelpers.defaultPackDto,
        accessToken: validAccessToken,
      });

      const { body: listPack } = await ctx.listPackHelpers.upsertListInPack({
        payload: { listId: uuidv7(), packId: pack.id, quantity: 1 },
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(listPack).toMatchObject({
        error: 'Not Found',
      });
    });

    it('should return 404 if the pack is not found', async () => {
      const { body: list } = await ctx.listHelpers.createList({
        payload: ctx.listHelpers.defaultListDto,
        accessToken: validAccessToken,
      });

      const { body: listPack } = await ctx.listPackHelpers.upsertListInPack({
        payload: { listId: list.id, packId: uuidv7(), quantity: 1 },
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(listPack).toMatchObject({
        error: 'Not Found',
      });
    });

    it('should return 404 if the list and pack do not belong to the same user', async () => {
      const { body: list } = await ctx.listHelpers.createList({
        payload: ctx.listHelpers.defaultListDto,
        accessToken: validAccessToken,
      });
      const userId2 = uuidv7();
      const validAccessToken2 = ctx.authHelpers.getValidAccessToken(userId2);
      const { body: pack } = await ctx.packHelpers.createPack({
        payload: ctx.packHelpers.defaultPackDto,
        accessToken: validAccessToken2,
      });

      const { body: listPack } = await ctx.listPackHelpers.upsertListInPack({
        payload: { listId: list.id, packId: pack.id, quantity: 1 },
        accessToken: validAccessToken2,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(listPack).toMatchObject({
        error: 'Not Found',
      });
    });

    it('should return 401 if the user is not authenticated', async () => {
      const { body: list } = await ctx.listHelpers.createList({
        payload: ctx.listHelpers.defaultListDto,
        accessToken: validAccessToken,
      });
      const { body: pack } = await ctx.packHelpers.createPack({
        payload: ctx.packHelpers.defaultPackDto,
        accessToken: validAccessToken,
      });

      const { body: listPack } = await ctx.listPackHelpers.upsertListInPack({
        payload: { listId: list.id, packId: pack.id, quantity: 1 },
        accessToken: '',
        expectedStatus: HttpStatus.UNAUTHORIZED,
      });

      expect(listPack).toMatchObject({
        error: 'Unauthorized',
      });
    });

    it('should return 400 if the payload is invalid', async () => {
      const { body: pack } = await ctx.packHelpers.createPack({
        payload: ctx.packHelpers.defaultPackDto,
        accessToken: validAccessToken,
      });

      const { body: listPack } = await ctx.listPackHelpers.upsertListInPack({
        payload: { packId: pack.id, quantity: 1 },
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.BAD_REQUEST,
      });

      expect(listPack).toMatchObject({
        error: 'Bad Request',
      });
    });
  });

  describe('ListPack - /list-pack (DELETE)', () => {
    it('should remove a list from a pack', async () => {
      const { body: list } = await ctx.listHelpers.createList({
        payload: ctx.listHelpers.defaultListDto,
        accessToken: validAccessToken,
      });
      const { body: pack } = await ctx.packHelpers.createPack({
        payload: ctx.packHelpers.defaultPackDto,
        accessToken: validAccessToken,
      });
      await ctx.listPackHelpers.upsertListInPack({
        payload: { listId: list.id, packId: pack.id, quantity: 1 },
        accessToken: validAccessToken,
      });

      await ctx.listPackHelpers.removeListFromPack({
        listId: list.id,
        packId: pack.id,
        accessToken: validAccessToken,
      });

      const { body: updatedPack } = await ctx.packHelpers.getPack({
        id: pack.id,
        accessToken: validAccessToken,
      });
      expect(updatedPack.lists).toHaveLength(0);
    });

    it('should return 404 if the list is not found', async () => {
      const { body: pack } = await ctx.packHelpers.createPack({
        payload: ctx.packHelpers.defaultPackDto,
        accessToken: validAccessToken,
      });

      const { body } = await ctx.listPackHelpers.removeListFromPack({
        listId: uuidv7(),
        packId: pack.id,
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(body).toMatchObject({ error: 'Not Found' });
    });

    it('should return 404 if the pack is not found', async () => {
      const { body: list } = await ctx.listHelpers.createList({
        payload: ctx.listHelpers.defaultListDto,
        accessToken: validAccessToken,
      });

      const { body } = await ctx.listPackHelpers.removeListFromPack({
        listId: list.id,
        packId: uuidv7(),
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(body).toMatchObject({ error: 'Not Found' });
    });

    it('should return 404 if the list does not belong to the pack', async () => {
      const { body: list } = await ctx.listHelpers.createList({
        payload: ctx.listHelpers.defaultListDto,
        accessToken: validAccessToken,
      });
      const { body: pack } = await ctx.packHelpers.createPack({
        payload: ctx.packHelpers.defaultPackDto,
        accessToken: validAccessToken,
      });

      const { body } = await ctx.listPackHelpers.removeListFromPack({
        listId: list.id,
        packId: pack.id,
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(body).toMatchObject({ error: 'Not Found' });
    });

    it('should return 404 if the list and pack do not belong to the same user', async () => {
      const { body: list } = await ctx.listHelpers.createList({
        payload: ctx.listHelpers.defaultListDto,
        accessToken: validAccessToken,
      });
      const userId2 = uuidv7();
      const validAccessToken2 = ctx.authHelpers.getValidAccessToken(userId2);
      const { body: pack } = await ctx.packHelpers.createPack({
        payload: ctx.packHelpers.defaultPackDto,
        accessToken: validAccessToken2,
      });

      const { body } = await ctx.listPackHelpers.removeListFromPack({
        listId: list.id,
        packId: pack.id,
        accessToken: validAccessToken2,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(body).toMatchObject({ error: 'Not Found' });
    });

    it('should return 401 if the user is not authenticated', async () => {
      const { body: list } = await ctx.listHelpers.createList({
        payload: ctx.listHelpers.defaultListDto,
        accessToken: validAccessToken,
      });
      const { body: pack } = await ctx.packHelpers.createPack({
        payload: ctx.packHelpers.defaultPackDto,
        accessToken: validAccessToken,
      });

      const { body } = await ctx.listPackHelpers.removeListFromPack({
        listId: list.id,
        packId: pack.id,
        accessToken: '',
        expectedStatus: HttpStatus.UNAUTHORIZED,
      });

      expect(body).toMatchObject({ error: 'Unauthorized' });
    });
  });
});
