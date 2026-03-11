import { HttpStatus, INestApplication } from '@nestjs/common';

import request from 'supertest';
import { App } from 'supertest/types';

import { CreateTripDto } from '@/modules/trip/dto/create-trip.dto';
import { TripResponseDto } from '@/modules/trip/dto/trip-response.dto';
import { UpdateTripDto } from '@/modules/trip/dto/update-trip.dto';

export class TripHelpers {
  constructor(
    private readonly app: INestApplication<App>,
    private readonly bffSecret: string,
  ) {}

  get defaultTripDto() {
    return {
      name: 'Test Trip',
      date: new Date('2024-01-15T10:00:00.000Z'),
      remarks: 'Test Remarks',
    };
  }

  async createTrip(options: {
    payload: Partial<CreateTripDto> | null;
    accessToken: string;
    expectedStatus?: number;
  }): Promise<{
    body: TripResponseDto;
  }> {
    const { payload, accessToken, expectedStatus = HttpStatus.CREATED } = options;

    const req = request(this.app.getHttpServer())
      .post('/trip')
      .send(payload ?? undefined) // For testing invalid payloads
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-bff-secret', this.bffSecret);

    return req.expect(expectedStatus);
  }

  async getTrip(options: { id: string; accessToken: string; expectedStatus?: number }): Promise<{
    body: TripResponseDto;
  }> {
    const { id, accessToken, expectedStatus = HttpStatus.OK } = options;

    const req = request(this.app.getHttpServer())
      .get(`/trip/${id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-bff-secret', this.bffSecret);

    return req.expect(expectedStatus);
  }

  async updateTrip(options: {
    id: string;
    payload: Partial<UpdateTripDto> | null;
    accessToken: string;
    expectedStatus?: number;
  }): Promise<{
    body: TripResponseDto;
  }> {
    const { id, payload, accessToken, expectedStatus = HttpStatus.OK } = options;

    const req = request(this.app.getHttpServer())
      .patch(`/trip/${id}`)
      .send(payload ?? undefined) // For testing invalid payloads
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-bff-secret', this.bffSecret);

    return req.expect(expectedStatus);
  }
}
