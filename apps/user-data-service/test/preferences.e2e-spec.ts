import { HttpStatus } from '@nestjs/common';

import request from 'supertest';
import { v7 as uuidv7 } from 'uuid';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { CreatePreferencesDto } from '@/preferences/dto/create-preferences.dto';
import { UpdatePreferencesDto } from '@/preferences/dto/update-preferences.dto';
import { DateFormat, Theme, TimeFormat, Units } from '@/preferences/types/preferences.types';

import { isoDateMatcher } from './helpers/matchers.helpers';
import { createIntegrationContext, IntegrationTestContext } from './helpers/setup.helpers';

describe('Preferences (e2e)', () => {
  let ctx: IntegrationTestContext;
  let preferencesDto: CreatePreferencesDto;

  // Regenerated per test so each test has a fresh throttle key (tracker = user:{userId})
  let userId: string;
  let validAccessToken: string;

  beforeAll(async () => {
    ctx = await createIntegrationContext();
    preferencesDto = ctx.preferencesHelpers.defaultPreferencesDto;
  });

  beforeEach(async () => {
    await ctx.resetDb();
    userId = uuidv7();
    validAccessToken = ctx.authHelpers.getValidAccessToken(userId);
  });

  afterAll(async () => {
    await ctx?.close();
  });

  describe('Preferences - /preferences (POST)', () => {
    it('should create preferences', async () => {
      const { body } = await ctx.preferencesHelpers.createPreferences({
        payload: preferencesDto,
        accessToken: validAccessToken,
      });

      expect(body).toMatchObject({
        userId,
        units: preferencesDto.units,
        theme: preferencesDto.theme,
        dateFormat: preferencesDto.dateFormat,
        timeFormat: preferencesDto.timeFormat,
        createdAt: isoDateMatcher,
        updatedAt: isoDateMatcher,
      });
    });

    it('should create preferences with partial fields', async () => {
      const { body } = await ctx.preferencesHelpers.createPreferences({
        payload: { units: Units.IMPERIAL },
        accessToken: validAccessToken,
      });

      expect(body).toMatchObject({ userId, units: 'imperial' });
    });

    it('should upsert (overwrite) preferences if they already exist', async () => {
      await ctx.preferencesHelpers.createPreferences({
        payload: preferencesDto,
        accessToken: validAccessToken,
      });

      const { body } = await ctx.preferencesHelpers.createPreferences({
        payload: { ...preferencesDto, units: Units.IMPERIAL },
        accessToken: validAccessToken,
      });

      expect(body).toMatchObject({ userId, units: 'imperial' });
    });

    it('should create separate preferences per user', async () => {
      const userId2 = uuidv7();
      const validAccessToken2 = ctx.authHelpers.getValidAccessToken(userId2);

      await ctx.preferencesHelpers.createPreferences({
        payload: { units: Units.METRIC, theme: Theme.LIGHT },
        accessToken: validAccessToken,
      });

      const { body } = await ctx.preferencesHelpers.createPreferences({
        payload: { units: Units.IMPERIAL, theme: Theme.DARK },
        accessToken: validAccessToken2,
      });

      expect(body.userId).toBe(userId2);
      expect(body.units).toBe('imperial');
      expect(body.theme).toBe('dark');
    });

    it('should return 401 if not authenticated', async () => {
      const { body } = await ctx.preferencesHelpers.createPreferences({
        payload: preferencesDto,
        accessToken: '',
        expectedStatus: HttpStatus.UNAUTHORIZED,
      });

      expect(body).toMatchObject({ error: 'Unauthorized' });
    });

    it('should return 401 if BFF secret is missing', async () => {
      await request(ctx.app.getHttpServer())
        .post('/preferences')
        .send(preferencesDto)
        .set('Authorization', `Bearer ${validAccessToken}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 400 if payload contains an unknown field', async () => {
      const { body } = await ctx.preferencesHelpers.createPreferences({
        payload: { unknownField: 'value' } as unknown as Partial<CreatePreferencesDto>,
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.BAD_REQUEST,
      });

      expect(body).toMatchObject({ error: 'Bad Request' });
    });

    it('should return 400 if a field has the wrong type', async () => {
      const { body } = await ctx.preferencesHelpers.createPreferences({
        payload: { units: 123 } as unknown as Partial<CreatePreferencesDto>,
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.BAD_REQUEST,
      });

      expect(body).toMatchObject({ error: 'Bad Request' });
    });
  });

  describe('Preferences - /preferences (GET)', () => {
    it('should return preferences for the authenticated user', async () => {
      await ctx.preferencesHelpers.createPreferences({
        payload: preferencesDto,
        accessToken: validAccessToken,
      });

      const { body } = await ctx.preferencesHelpers.getPreferences({
        accessToken: validAccessToken,
      });

      expect(body).toMatchObject({
        userId,
        units: preferencesDto.units,
        theme: preferencesDto.theme,
        dateFormat: preferencesDto.dateFormat,
        timeFormat: preferencesDto.timeFormat,
        createdAt: isoDateMatcher,
        updatedAt: isoDateMatcher,
      });
    });

    it('should return empty response when preferences do not exist', async () => {
      const { body } = await ctx.preferencesHelpers.getPreferences({
        accessToken: validAccessToken,
      });

      // NestJS returns an empty body (no content) when the handler returns null
      expect(body).not.toHaveProperty('userId');
    });

    it("should not return another user's preferences", async () => {
      const userId2 = uuidv7();
      const validAccessToken2 = ctx.authHelpers.getValidAccessToken(userId2);

      await ctx.preferencesHelpers.createPreferences({
        payload: preferencesDto,
        accessToken: validAccessToken,
      });

      const { body } = await ctx.preferencesHelpers.getPreferences({
        accessToken: validAccessToken2,
      });

      expect(body).not.toHaveProperty('userId');
    });

    it('should return 401 if not authenticated', async () => {
      const { body } = await ctx.preferencesHelpers.getPreferences({
        accessToken: '',
        expectedStatus: HttpStatus.UNAUTHORIZED,
      });

      expect(body).toMatchObject({ error: 'Unauthorized' });
    });

    it('should return 401 if BFF secret is missing', async () => {
      await request(ctx.app.getHttpServer())
        .get('/preferences')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('Preferences - /preferences (PATCH)', () => {
    it('should update preferences (all fields)', async () => {
      await ctx.preferencesHelpers.createPreferences({
        payload: preferencesDto,
        accessToken: validAccessToken,
      });

      const updateDto: UpdatePreferencesDto = {
        units: Units.IMPERIAL,
        theme: Theme.DARK,
        dateFormat: DateFormat.MM_DD_YY_SLASH,
        timeFormat: TimeFormat.TWELVE_HOUR,
      };

      const { body } = await ctx.preferencesHelpers.updatePreferences({
        payload: updateDto,
        accessToken: validAccessToken,
      });

      expect(body).toMatchObject({
        userId,
        units: 'imperial',
        theme: 'dark',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
        createdAt: isoDateMatcher,
        updatedAt: isoDateMatcher,
      });
    });

    it('should update preferences (single field, others unchanged)', async () => {
      await ctx.preferencesHelpers.createPreferences({
        payload: preferencesDto,
        accessToken: validAccessToken,
      });

      const { body } = await ctx.preferencesHelpers.updatePreferences({
        payload: { theme: Theme.DARK },
        accessToken: validAccessToken,
      });

      expect(body).toMatchObject({
        userId,
        units: preferencesDto.units,
        theme: 'dark',
        dateFormat: preferencesDto.dateFormat,
        timeFormat: preferencesDto.timeFormat,
      });
    });

    it('should return empty response when preferences do not exist', async () => {
      const { body } = await ctx.preferencesHelpers.updatePreferences({
        payload: { theme: Theme.DARK },
        accessToken: validAccessToken,
      });

      // NestJS returns an empty body (no content) when the handler returns null
      expect(body).not.toHaveProperty('userId');
    });

    it('should return 401 if not authenticated', async () => {
      const { body } = await ctx.preferencesHelpers.updatePreferences({
        payload: { theme: Theme.DARK },
        accessToken: '',
        expectedStatus: HttpStatus.UNAUTHORIZED,
      });

      expect(body).toMatchObject({ error: 'Unauthorized' });
    });

    it('should return 400 if payload contains an unknown field', async () => {
      const { body } = await ctx.preferencesHelpers.updatePreferences({
        payload: { unknownField: 'value' } as unknown as Partial<UpdatePreferencesDto>,
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.BAD_REQUEST,
      });

      expect(body).toMatchObject({ error: 'Bad Request' });
    });

    it('should return 400 if a field has the wrong type', async () => {
      const { body } = await ctx.preferencesHelpers.updatePreferences({
        payload: { theme: 123 } as unknown as Partial<UpdatePreferencesDto>,
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.BAD_REQUEST,
      });

      expect(body).toMatchObject({ error: 'Bad Request' });
    });

    it('should return 401 if BFF secret is missing', async () => {
      await request(ctx.app.getHttpServer())
        .patch('/preferences')
        .send({ theme: 'dark' })
        .set('Authorization', `Bearer ${validAccessToken}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('Preferences - /preferences (DELETE)', () => {
    it('should delete existing preferences successfully', async () => {
      await ctx.preferencesHelpers.createPreferences({
        payload: preferencesDto,
        accessToken: validAccessToken,
      });

      // Status 200 confirms deletion succeeded (NestJS returns empty body for boolean primitives)
      await ctx.preferencesHelpers.deletePreferences({
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.OK,
      });
    });

    it('should delete preferences — subsequent GET returns no data', async () => {
      await ctx.preferencesHelpers.createPreferences({
        payload: preferencesDto,
        accessToken: validAccessToken,
      });

      await ctx.preferencesHelpers.deletePreferences({ accessToken: validAccessToken });

      const { body } = await ctx.preferencesHelpers.getPreferences({
        accessToken: validAccessToken,
      });

      expect(body).not.toHaveProperty('userId');
    });

    it('should complete without error when preferences do not exist', async () => {
      // DELETE returns false (no document found); NestJS sends an empty body for boolean primitives
      // Status 200 confirms no error was thrown
      await ctx.preferencesHelpers.deletePreferences({
        accessToken: validAccessToken,
        expectedStatus: HttpStatus.OK,
      });
    });

    it("should only delete the authenticated user's preferences", async () => {
      const userId2 = uuidv7();
      const validAccessToken2 = ctx.authHelpers.getValidAccessToken(userId2);

      await ctx.preferencesHelpers.createPreferences({
        payload: preferencesDto,
        accessToken: validAccessToken,
      });
      await ctx.preferencesHelpers.createPreferences({
        payload: preferencesDto,
        accessToken: validAccessToken2,
      });

      await ctx.preferencesHelpers.deletePreferences({ accessToken: validAccessToken });

      const { body: user1Prefs } = await ctx.preferencesHelpers.getPreferences({
        accessToken: validAccessToken,
      });
      const { body: user2Prefs } = await ctx.preferencesHelpers.getPreferences({
        accessToken: validAccessToken2,
      });

      expect(user1Prefs).not.toHaveProperty('userId');
      expect(user2Prefs).toHaveProperty('userId', userId2);
    });

    it('should return 401 if not authenticated', async () => {
      const { body } = await ctx.preferencesHelpers.deletePreferences({
        accessToken: '',
        expectedStatus: HttpStatus.UNAUTHORIZED,
      });

      expect(body).toMatchObject({ error: 'Unauthorized' });
    });

    it('should return 401 if BFF secret is missing', async () => {
      await request(ctx.app.getHttpServer())
        .delete('/preferences')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });
});
