import { HttpStatus } from '@nestjs/common';

import { v7 as uuidv7 } from 'uuid';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { CreatePackDto } from '@/modules/pack/dto/create-pack.dto';
import { PackResponseDto } from '@/modules/pack/dto/pack-response.dto';
import { CreateTripDto } from '@/modules/trip/dto/create-trip.dto';
import { UpdateTripDto } from '@/modules/trip/dto/update-trip.dto';

import { createTripWithPack } from './fixtures/product.fixtures';
import { isoDateMatcher } from './helpers/matchers.helpers';
import { createIntegrationContext, IntegrationTestContext } from './helpers/setup.helpers';

describe('Trip (e2e)', () => {
  let ctx: IntegrationTestContext;
  let validAccessToken: string;
  let tripDto: CreateTripDto;
  let packDto: CreatePackDto;

  const userId = uuidv7();
  const tripId = uuidv7(); // This is the trip id that will be used in "not found" tests

  beforeAll(async () => {
    ctx = await createIntegrationContext();
    validAccessToken = ctx.authHelpers.getValidAccessToken(userId);
    tripDto = ctx.tripHelpers.defaultTripDto;
    packDto = ctx.packHelpers.defaultPackDto;
  });

  beforeEach(async () => {
    await ctx.resetDb();
  });

  afterAll(async () => {
    await ctx?.close();
  });

  describe('Trip - /trip (POST)', () => {
    it('should create a trip', async () => {
      const { body } = await ctx.tripHelpers.createTrip({
        payload: tripDto,
        accessToken: validAccessToken,
      });

      expect(body).toMatchObject({
        id: expect.any(String) as string,
        name: tripDto.name,
        date: tripDto.date?.toISOString(),
        remarks: tripDto.remarks,
        createdAt: isoDateMatcher,
        updatedAt: isoDateMatcher,
        pack: null,
      });
    });

    it('should create a trip with a pack', async () => {
      const { body: pack } = await ctx.packHelpers.createPack({
        payload: packDto,
        accessToken: validAccessToken,
      });
      const { body } = await ctx.tripHelpers.createTrip({
        payload: { ...tripDto, packId: pack.id },
        accessToken: validAccessToken,
      });

      expect(body).toMatchObject({
        id: expect.any(String) as string,
        name: tripDto.name,
        date: tripDto.date?.toISOString(),
        remarks: tripDto.remarks,
        createdAt: isoDateMatcher,
        updatedAt: isoDateMatcher,
        pack: expect.objectContaining({
          id: pack.id,
          name: pack.name,
          description: pack.description,
          colorCode: pack.colorCode,
          createdAt: isoDateMatcher,
          updatedAt: isoDateMatcher,
        }) as PackResponseDto,
      });
    });

    it('should not create a trip with a pack id from another user', async () => {
      const { body: pack } = await ctx.packHelpers.createPack({
        payload: packDto,
        accessToken: validAccessToken,
      });
      const userId2 = uuidv7();
      const validAccessToken2 = ctx.authHelpers.getValidAccessToken(userId2);
      const { body } = await ctx.tripHelpers.createTrip({
        payload: { ...tripDto, packId: pack.id },
        accessToken: validAccessToken2,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(body).toMatchObject({ error: 'Not Found' });
    });

    it('should return 401 if the user is not authenticated', async () => {
      const { body } = await ctx.tripHelpers.createTrip({
        payload: tripDto,
        accessToken: '',
        expectedStatus: HttpStatus.UNAUTHORIZED,
      });

      expect(body).toMatchObject({ error: 'Unauthorized' });
    });

    it('should return 400 if the payload is invalid', async () => {
      const { body } = await ctx.tripHelpers.createTrip({
        payload: { name: 123 } as unknown as Partial<CreateTripDto>,
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.BAD_REQUEST,
      });

      expect(body).toMatchObject({ error: 'Bad Request' });
    });

    it('should return 400 if the payload is missing required fields', async () => {
      const { body } = await ctx.tripHelpers.createTrip({
        payload: { date: new Date('2024-01-15T10:00:00.000Z') },
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.BAD_REQUEST,
      });

      expect(body).toMatchObject({ error: 'Bad Request' });
    });
  });

  describe('Trip - /trip/:id (GET)', () => {
    it('should get a trip', async () => {
      const { body } = await ctx.tripHelpers.createTrip({
        payload: tripDto,
        accessToken: validAccessToken,
      });
      const { body: trip } = await ctx.tripHelpers.getTrip({
        id: body.id,
        accessToken: validAccessToken,
      });

      expect(trip).toMatchObject({
        id: body.id,
        name: tripDto.name,
        date: tripDto.date?.toISOString(),
        remarks: tripDto.remarks,
        createdAt: isoDateMatcher,
        updatedAt: isoDateMatcher,
        pack: null,
      });
    });

    it('should return a trip with a pack', async () => {
      const { body: pack } = await ctx.packHelpers.createPack({
        payload: packDto,
        accessToken: validAccessToken,
      });
      const { body } = await ctx.tripHelpers.createTrip({
        payload: { ...tripDto, packId: pack.id },
        accessToken: validAccessToken,
      });

      const { body: trip } = await ctx.tripHelpers.getTrip({
        id: body.id,
        accessToken: validAccessToken,
      });

      expect(trip).toMatchObject({
        id: body.id,
        name: tripDto.name,
        date: tripDto.date?.toISOString(),
        remarks: tripDto.remarks,
        createdAt: isoDateMatcher,
        updatedAt: isoDateMatcher,
        pack: expect.objectContaining({
          id: pack.id,
          name: pack.name,
          description: pack.description,
          colorCode: pack.colorCode,
          createdAt: isoDateMatcher,
          updatedAt: isoDateMatcher,
        }) as PackResponseDto,
      });
    });

    it('should return 401 if the user is not authenticated', async () => {
      const { body } = await ctx.tripHelpers.getTrip({
        id: tripId,
        accessToken: '',
        expectedStatus: HttpStatus.UNAUTHORIZED,
      });

      expect(body).toMatchObject({ error: 'Unauthorized' });
    });

    it('should return 404 if the trip is not found', async () => {
      const { body } = await ctx.tripHelpers.getTrip({
        id: tripId,
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(body).toMatchObject({ error: 'Not Found' });
    });

    it('should return 404 if the trip belongs to another user', async () => {
      const { body: trip } = await ctx.tripHelpers.createTrip({
        payload: tripDto,
        accessToken: validAccessToken,
      });
      const userId2 = uuidv7();
      const validAccessToken2 = ctx.authHelpers.getValidAccessToken(userId2);
      const { body } = await ctx.tripHelpers.getTrip({
        id: trip.id,
        accessToken: validAccessToken2,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(body).toMatchObject({ error: 'Not Found' });
    });

    it('should return 400 if the id is not a valid uuid v7', async () => {
      const { body } = await ctx.tripHelpers.getTrip({
        id: 'invalid-id',
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.BAD_REQUEST,
      });

      expect(body).toMatchObject({ error: 'Bad Request' });
    });
  });

  describe('Trip - /trip (GET)', () => {
    it('should get all trips, without packs', async () => {
      const { body: trip1 } = await ctx.tripHelpers.createTrip({
        payload: tripDto,
        accessToken: validAccessToken,
      });
      const { body: trip2 } = await ctx.tripHelpers.createTrip({
        payload: tripDto,
        accessToken: validAccessToken,
      });

      const { body: trips } = await ctx.tripHelpers.getTrips({
        accessToken: validAccessToken,
      });

      expect(trips).toHaveLength(2);
      expect(trips).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: trip1.id,
            name: trip1.name,
            date: trip1.date,
            remarks: trip1.remarks,
            pack: null,
          }),
          expect.objectContaining({
            id: trip2.id,
            name: trip2.name,
            date: trip2.date,
            remarks: trip2.remarks,
            pack: null,
          }),
        ]),
      );
    });

    it('should return an empty array if the user has no trips', async () => {
      const { body } = await ctx.tripHelpers.getTrips({
        accessToken: validAccessToken,
      });

      expect(body).toHaveLength(0);
      expect(body).toEqual([]);
    });

    it('should return trips with packs', async () => {
      const { body: pack } = await ctx.packHelpers.createPack({
        payload: packDto,
        accessToken: validAccessToken,
      });
      const { body: trip } = await ctx.tripHelpers.createTrip({
        payload: { ...tripDto, packId: pack.id },
        accessToken: validAccessToken,
      });

      const { body: trips } = await ctx.tripHelpers.getTrips({
        accessToken: validAccessToken,
      });

      expect(trips).toHaveLength(1);
      expect(trips).toContainEqual(trip);
      expect(trips).toContainEqual(
        expect.objectContaining({
          pack: expect.objectContaining({
            id: pack.id,
            name: pack.name,
            description: pack.description,
            colorCode: pack.colorCode,
          }) as PackResponseDto,
        }),
      );
    });

    it('should only return trips belonging to the authenticated user', async () => {
      const { body: trip1 } = await ctx.tripHelpers.createTrip({
        payload: tripDto,
        accessToken: validAccessToken,
      });
      const userId2 = uuidv7();
      const validAccessToken2 = ctx.authHelpers.getValidAccessToken(userId2);

      const { body: tripsUser1 } = await ctx.tripHelpers.getTrips({
        accessToken: validAccessToken,
      });
      const { body: tripsUser2 } = await ctx.tripHelpers.getTrips({
        accessToken: validAccessToken2,
      });

      expect(tripsUser1).toHaveLength(1);
      expect(tripsUser1).toContainEqual(trip1);

      expect(tripsUser2).toHaveLength(0);
      expect(tripsUser2).toEqual([]);
    });

    it('should return 401 if the user is not authenticated', async () => {
      const { body } = await ctx.tripHelpers.getTrips({
        accessToken: '',
        expectedStatus: HttpStatus.UNAUTHORIZED,
      });

      expect(body).toMatchObject({ error: 'Unauthorized' });
    });
  });

  describe('Trip - /trip/:id (PATCH)', () => {
    it('should update a trip (multiple fields)', async () => {
      const { body } = await ctx.tripHelpers.createTrip({
        payload: tripDto,
        accessToken: validAccessToken,
      });
      const { body: createdTrip } = await ctx.tripHelpers.getTrip({
        id: body.id,
        accessToken: validAccessToken,
      });

      expect(createdTrip).toMatchObject({
        name: tripDto.name,
        date: tripDto.date?.toISOString(),
        remarks: tripDto.remarks,
        createdAt: isoDateMatcher,
        updatedAt: isoDateMatcher,
        pack: null,
      });

      const newDate = new Date('2024-01-16T10:00:00.000Z');
      await ctx.tripHelpers.updateTrip({
        id: body.id,
        payload: { name: 'Updated Name', date: newDate, remarks: 'Updated Remarks' },
        accessToken: validAccessToken,
      });

      const { body: updatedTrip } = await ctx.tripHelpers.getTrip({
        id: body.id,
        accessToken: validAccessToken,
      });

      expect(updatedTrip).toMatchObject({
        name: 'Updated Name',
        date: newDate.toISOString(),
        remarks: 'Updated Remarks',
        createdAt: isoDateMatcher,
        updatedAt: isoDateMatcher,
        pack: null,
      });
    });

    it('should update a trip (single field)', async () => {
      const { body } = await ctx.tripHelpers.createTrip({
        payload: tripDto,
        accessToken: validAccessToken,
      });
      const { body: createdTrip } = await ctx.tripHelpers.getTrip({
        id: body.id,
        accessToken: validAccessToken,
      });

      expect(createdTrip).toMatchObject({
        name: tripDto.name,
        date: tripDto.date?.toISOString(),
        remarks: tripDto.remarks,
        createdAt: isoDateMatcher,
        updatedAt: isoDateMatcher,
        pack: null,
      });

      await ctx.tripHelpers.updateTrip({
        id: body.id,
        payload: { name: 'Updated Name' },
        accessToken: validAccessToken,
      });

      const { body: updatedTrip } = await ctx.tripHelpers.getTrip({
        id: body.id,
        accessToken: validAccessToken,
      });

      expect(updatedTrip).toMatchObject({
        name: 'Updated Name',
        date: tripDto.date?.toISOString(),
        remarks: tripDto.remarks,
        createdAt: isoDateMatcher,
        updatedAt: isoDateMatcher,
        pack: null,
      });
    });

    it('should update a trip and connect a pack', async () => {
      const { body: pack } = await ctx.packHelpers.createPack({
        payload: packDto,
        accessToken: validAccessToken,
      });
      const { body } = await ctx.tripHelpers.createTrip({
        payload: tripDto,
        accessToken: validAccessToken,
      });

      await ctx.tripHelpers.updateTrip({
        id: body.id,
        payload: { packId: pack.id },
        accessToken: validAccessToken,
      });

      const { body: updatedTrip } = await ctx.tripHelpers.getTrip({
        id: body.id,
        accessToken: validAccessToken,
      });

      expect(updatedTrip).toMatchObject({
        pack: expect.objectContaining({
          id: pack.id,
          name: pack.name,
          description: pack.description,
          colorCode: pack.colorCode,
          createdAt: isoDateMatcher,
          updatedAt: isoDateMatcher,
        }) as PackResponseDto,
      });
    });

    it('should update a trip and disconnect a pack', async () => {
      const { trip, pack } = await createTripWithPack(ctx, validAccessToken);

      const { body: createdTrip } = await ctx.tripHelpers.getTrip({
        id: trip.id,
        accessToken: validAccessToken,
      });

      expect(createdTrip).toMatchObject({
        pack: expect.objectContaining({
          id: pack.id,
          name: pack.name,
          description: pack.description,
          colorCode: pack.colorCode,
          createdAt: isoDateMatcher,
          updatedAt: isoDateMatcher,
        }) as PackResponseDto,
      });

      await ctx.tripHelpers.updateTrip({
        id: trip.id,
        payload: { packId: null } as unknown as Partial<UpdateTripDto>,
        accessToken: validAccessToken,
      });

      const { body: updatedTrip } = await ctx.tripHelpers.getTrip({
        id: trip.id,
        accessToken: validAccessToken,
      });

      expect(updatedTrip).toMatchObject({
        pack: null,
      });
    });

    it('should update a trip without touching the pack when packId is absent', async () => {
      const { trip, pack } = await createTripWithPack(ctx, validAccessToken);

      const { body: createdTrip } = await ctx.tripHelpers.getTrip({
        id: trip.id,
        accessToken: validAccessToken,
      });

      expect(createdTrip).toMatchObject({
        pack: expect.objectContaining({
          id: pack.id,
          name: pack.name,
          description: pack.description,
          colorCode: pack.colorCode,
          createdAt: isoDateMatcher,
          updatedAt: isoDateMatcher,
        }) as PackResponseDto,
      });

      await ctx.tripHelpers.updateTrip({
        id: trip.id,
        payload: { name: 'Updated Name' },
        accessToken: validAccessToken,
      });

      const { body: updatedTrip } = await ctx.tripHelpers.getTrip({
        id: trip.id,
        accessToken: validAccessToken,
      });

      expect(updatedTrip).toMatchObject({
        pack: expect.objectContaining({
          id: pack.id,
          name: pack.name,
          description: pack.description,
          colorCode: pack.colorCode,
          createdAt: isoDateMatcher,
          updatedAt: isoDateMatcher,
        }) as PackResponseDto,
      });
    });

    it('should not update a trip with a pack id from another user', async () => {
      const { body: pack } = await ctx.packHelpers.createPack({
        payload: packDto,
        accessToken: validAccessToken,
      });
      const userId2 = uuidv7();
      const validAccessToken2 = ctx.authHelpers.getValidAccessToken(userId2);
      const { body: trip } = await ctx.tripHelpers.createTrip({
        payload: tripDto,
        accessToken: validAccessToken2,
      });

      const { body } = await ctx.tripHelpers.updateTrip({
        id: trip.id,
        payload: { packId: pack.id },
        accessToken: validAccessToken2,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(body).toMatchObject({ error: 'Not Found' });
    });

    it('should return 401 if the user is not authenticated', async () => {
      const { body } = await ctx.tripHelpers.updateTrip({
        id: tripId,
        payload: { name: 'Updated Name' },
        accessToken: '',
        expectedStatus: HttpStatus.UNAUTHORIZED,
      });

      expect(body).toMatchObject({ error: 'Unauthorized' });
    });

    it('should return 404 if the trip is not found', async () => {
      const { body } = await ctx.tripHelpers.updateTrip({
        id: tripId,
        payload: { name: 'Updated Name' },
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(body).toMatchObject({ error: 'Not Found' });
    });

    it('should return 404 if the trip belongs to another user', async () => {
      const { trip } = await createTripWithPack(ctx, validAccessToken);
      const userId2 = uuidv7();
      const validAccessToken2 = ctx.authHelpers.getValidAccessToken(userId2);

      const { body } = await ctx.tripHelpers.updateTrip({
        id: trip.id,
        payload: { name: 'Updated Name' },
        accessToken: validAccessToken2,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(body).toMatchObject({ error: 'Not Found' });
    });

    it('should return 400 if the id is not a valid uuid v7', async () => {
      const { body } = await ctx.tripHelpers.updateTrip({
        id: 'invalid-id',
        payload: { name: 'Updated Name' },
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.BAD_REQUEST,
      });

      expect(body).toMatchObject({ error: 'Bad Request' });
    });

    it('should return 400 if the payload is invalid', async () => {
      const { body: trip } = await ctx.tripHelpers.createTrip({
        payload: tripDto,
        accessToken: validAccessToken,
      });

      const { body } = await ctx.tripHelpers.updateTrip({
        id: trip.id,
        payload: { name: 123 } as unknown as Partial<UpdateTripDto>,
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.BAD_REQUEST,
      });

      expect(body).toMatchObject({ error: 'Bad Request' });
    });
  });

  describe('Trip - /trip/:id (DELETE)', () => {
    it('should delete a trip, not used in any pack', async () => {
      const { body: trip } = await ctx.tripHelpers.createTrip({
        payload: tripDto,
        accessToken: validAccessToken,
      });

      await ctx.tripHelpers.deleteTrip({
        id: trip.id,
        accessToken: validAccessToken,
      });

      const { body: deletedTrip } = await ctx.tripHelpers.getTrip({
        id: trip.id,
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(deletedTrip).toMatchObject({ error: 'Not Found' });
    });

    it('should delete a trip, using a pack', async () => {
      const { trip, pack } = await createTripWithPack(ctx, validAccessToken);

      const { body: createdTrip } = await ctx.tripHelpers.getTrip({
        id: trip.id,
        accessToken: validAccessToken,
      });

      expect(createdTrip).toMatchObject({
        pack: expect.objectContaining({
          id: pack.id,
          name: pack.name,
          description: pack.description,
          colorCode: pack.colorCode,
          createdAt: isoDateMatcher,
          updatedAt: isoDateMatcher,
        }) as PackResponseDto,
      });

      await ctx.tripHelpers.deleteTrip({
        id: trip.id,
        accessToken: validAccessToken,
      });

      const { body: deletedTrip } = await ctx.tripHelpers.getTrip({
        id: trip.id,
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(deletedTrip).toMatchObject({ error: 'Not Found' });

      const { body: packAfterTripDeletion } = await ctx.packHelpers.getPack({
        id: pack.id,
        accessToken: validAccessToken,
      });

      expect(packAfterTripDeletion).toMatchObject(pack);
    });

    it('should return 401 if the user is not authenticated', async () => {
      const { body } = await ctx.tripHelpers.deleteTrip({
        id: tripId,
        accessToken: '',
        expectedStatus: HttpStatus.UNAUTHORIZED,
      });

      expect(body).toMatchObject({ error: 'Unauthorized' });
    });

    it('should return 404 if the trip is not found', async () => {
      const { body } = await ctx.tripHelpers.deleteTrip({
        id: tripId,
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(body).toMatchObject({ error: 'Not Found' });
    });

    it('should return 404 if the trip belongs to another user', async () => {
      const { trip } = await createTripWithPack(ctx, validAccessToken);
      const userId2 = uuidv7();
      const validAccessToken2 = ctx.authHelpers.getValidAccessToken(userId2);

      const { body } = await ctx.tripHelpers.deleteTrip({
        id: trip.id,
        accessToken: validAccessToken2,
        expectedStatus: HttpStatus.NOT_FOUND,
      });

      expect(body).toMatchObject({ error: 'Not Found' });
    });

    it('should return 400 if the id is not a valid uuid v7', async () => {
      const { body } = await ctx.tripHelpers.deleteTrip({
        id: 'invalid-id',
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.BAD_REQUEST,
      });

      expect(body).toMatchObject({ error: 'Bad Request' });
    });
  });
});
