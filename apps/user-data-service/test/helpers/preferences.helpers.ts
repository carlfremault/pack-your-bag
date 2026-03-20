import { HttpStatus, INestApplication } from '@nestjs/common';

import request from 'supertest';
import { App } from 'supertest/types';

import { CreatePreferencesDto } from '@/preferences/dto/create-preferences.dto';
import { PreferencesResponseDto } from '@/preferences/dto/preferences-response.dto';
import { UpdatePreferencesDto } from '@/preferences/dto/update-preferences.dto';
import { DateFormat, Theme, TimeFormat, Units } from '@/preferences/types/preferences.types';

export class PreferencesHelpers {
  constructor(
    private readonly app: INestApplication<App>,
    private readonly bffSecret: string,
  ) {}

  get defaultPreferencesDto(): CreatePreferencesDto {
    return {
      units: Units.METRIC,
      theme: Theme.LIGHT,
      dateFormat: DateFormat.DD_MM_YY_SLASH,
      timeFormat: TimeFormat.TWENTY_FOUR_HOUR,
    };
  }

  async createPreferences(options: {
    payload: Partial<CreatePreferencesDto> | null;
    accessToken: string;
    expectedStatus?: number;
  }): Promise<{ body: PreferencesResponseDto }> {
    const { payload, accessToken, expectedStatus = HttpStatus.CREATED } = options;

    return request(this.app.getHttpServer())
      .post('/preferences')
      .send(payload ?? undefined)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-bff-secret', this.bffSecret)
      .expect(expectedStatus);
  }

  async getPreferences(options: {
    accessToken: string;
    expectedStatus?: number;
  }): Promise<{ body: PreferencesResponseDto | null }> {
    const { accessToken, expectedStatus = HttpStatus.OK } = options;

    return request(this.app.getHttpServer())
      .get('/preferences')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-bff-secret', this.bffSecret)
      .expect(expectedStatus);
  }

  async updatePreferences(options: {
    payload: Partial<UpdatePreferencesDto> | null;
    accessToken: string;
    expectedStatus?: number;
  }): Promise<{ body: PreferencesResponseDto | null }> {
    const { payload, accessToken, expectedStatus = HttpStatus.OK } = options;

    return request(this.app.getHttpServer())
      .patch('/preferences')
      .send(payload ?? undefined)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-bff-secret', this.bffSecret)
      .expect(expectedStatus);
  }

  async deletePreferences(options: {
    accessToken: string;
    expectedStatus?: number;
  }): Promise<{ body: boolean }> {
    const { accessToken, expectedStatus = HttpStatus.OK } = options;

    return request(this.app.getHttpServer())
      .delete('/preferences')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-bff-secret', this.bffSecret)
      .expect(expectedStatus);
  }
}
