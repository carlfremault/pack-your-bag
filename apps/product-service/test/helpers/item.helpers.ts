import { HttpStatus, INestApplication } from '@nestjs/common';

import request from 'supertest';
import { App } from 'supertest/types';

import { ItemResponseDto } from '@/common/dto/item-response.dto';
import { CreateItemDto } from '@/modules/item/dto/create-item.dto';
import { UpdateItemDto } from '@/modules/item/dto/update-item.dto';
import { ItemDeleteImpact } from '@/modules/item/item.service';

export class ItemHelpers {
  constructor(
    private readonly app: INestApplication<App>,
    private readonly bffSecret: string,
  ) {}

  get defaultItemDto() {
    return {
      name: 'Test Item',
      description: 'Test Description',
      weight: 1,
    };
  }

  async createItem(options: {
    payload: Partial<CreateItemDto> | null;
    accessToken: string;
    expectedStatus?: number;
  }): Promise<{
    body: ItemResponseDto;
  }> {
    const { payload, accessToken, expectedStatus = HttpStatus.CREATED } = options;

    const req = request(this.app.getHttpServer())
      .post('/item')
      .send(payload ?? undefined) // For testing invalid payloads
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-bff-secret', this.bffSecret);

    return req.expect(expectedStatus);
  }

  async getItem(options: { id: string; accessToken: string; expectedStatus?: number }): Promise<{
    body: ItemResponseDto;
  }> {
    const { id, accessToken, expectedStatus = HttpStatus.OK } = options;

    const req = request(this.app.getHttpServer())
      .get(`/item/${id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-bff-secret', this.bffSecret);

    return req.expect(expectedStatus);
  }

  async getItems(options: { accessToken: string; expectedStatus?: number }): Promise<{
    body: ItemResponseDto[];
  }> {
    const { accessToken, expectedStatus = HttpStatus.OK } = options;

    const req = request(this.app.getHttpServer())
      .get('/item')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-bff-secret', this.bffSecret);

    return req.expect(expectedStatus);
  }

  async updateItem(options: {
    id: string;
    payload: Partial<UpdateItemDto> | null;
    accessToken: string;
    expectedStatus?: number;
  }): Promise<{
    body: ItemResponseDto;
  }> {
    const { id, payload, accessToken, expectedStatus = HttpStatus.OK } = options;

    const req = request(this.app.getHttpServer())
      .patch(`/item/${id}`)
      .send(payload ?? undefined) // For testing invalid payloads
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-bff-secret', this.bffSecret);

    return req.expect(expectedStatus);
  }

  async deleteItem(options: { id: string; accessToken: string; expectedStatus?: number }): Promise<{
    body: ItemResponseDto;
  }> {
    const { id, accessToken, expectedStatus = HttpStatus.OK } = options;

    const req = request(this.app.getHttpServer())
      .delete(`/item/${id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-bff-secret', this.bffSecret);

    return req.expect(expectedStatus);
  }

  async getItemDeleteImpact(options: {
    id: string;
    accessToken: string;
    expectedStatus?: number;
  }): Promise<{
    body: ItemDeleteImpact;
  }> {
    const { id, accessToken, expectedStatus = HttpStatus.OK } = options;

    const req = request(this.app.getHttpServer())
      .get(`/item/${id}/delete-impact`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-bff-secret', this.bffSecret);

    return req.expect(expectedStatus);
  }
}
