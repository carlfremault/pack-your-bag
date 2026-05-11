import { HttpStatus, INestApplication } from '@nestjs/common';

import request from 'supertest';
import { App } from 'supertest/types';

import { CreateTripDto } from '@/modules/trip/dto/create-trip.dto';
import { TripResponseDto, TripSummaryResponseDto } from '@/modules/trip/dto/trip-response.dto';
import { UpdateTripDto } from '@/modules/trip/dto/update-trip.dto';
import { UpdateTripItemStatusDto } from '@/modules/trip/dto/update-trip-item-status.dto';

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

  async getTrips(options: { accessToken: string; expectedStatus?: number }): Promise<{
    body: TripSummaryResponseDto[];
  }> {
    const { accessToken, expectedStatus = HttpStatus.OK } = options;

    const req = request(this.app.getHttpServer())
      .get('/trip')
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

  async deleteTrip(options: { id: string; accessToken: string; expectedStatus?: number }): Promise<{
    body: TripResponseDto;
  }> {
    const { id, accessToken, expectedStatus = HttpStatus.NO_CONTENT } = options;

    const req = request(this.app.getHttpServer())
      .delete(`/trip/${id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-bff-secret', this.bffSecret);

    return req.expect(expectedStatus);
  }

  async setTripItemStatus(options: {
    tripId: string;
    itemId: string;
    payload: Partial<UpdateTripItemStatusDto> | null;
    accessToken: string;
    expectedStatus?: number;
  }): Promise<{ body: Record<string, never> }> {
    const {
      tripId,
      itemId,
      payload,
      accessToken,
      expectedStatus = HttpStatus.NO_CONTENT,
    } = options;

    const req = request(this.app.getHttpServer())
      .patch(`/trip/${tripId}/items/${itemId}/packed`)
      .send(payload ?? undefined)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-bff-secret', this.bffSecret);

    return req.expect(expectedStatus);
  }
}
