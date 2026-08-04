import { HttpStatus, INestApplication } from '@nestjs/common';

import request from 'supertest';
import { App } from 'supertest/types';

import { CreateAssistantPackDto } from '@/modules/pack/dto/assistant-pack.dto';
import { ClonePackDto } from '@/modules/pack/dto/clone-pack.dto';
import { CreatePackDto } from '@/modules/pack/dto/create-pack.dto';
import { PackDeleteImpactDto } from '@/modules/pack/dto/pack-delete-impact.dto';
import { PackResponseDto } from '@/modules/pack/dto/pack-response.dto';
import { UpdatePackDto } from '@/modules/pack/dto/update-pack.dto';

export class PackHelpers {
  constructor(
    private readonly app: INestApplication<App>,
    private readonly bffSecret: string,
  ) {}

  get defaultPackDto() {
    return {
      name: 'Test Pack',
      description: 'Test Description',
      colorTheme: 'slate',
    };
  }

  get defaultAssistantPackDto() {
    return {
      packName: 'Assistant Test Pack',
      items: [
        { name: 'Item 1', quantity: 2, category: { name: 'Category 1', colorTheme: 'slate' } },
        { name: 'Item 2', quantity: 3, category: { name: 'Category 2', colorTheme: 'slate' } },
      ],
    };
  }

  async createPack(options: {
    payload: Partial<CreatePackDto> | null;
    accessToken: string;
    expectedStatus?: number;
  }): Promise<{
    body: PackResponseDto;
  }> {
    const { payload, accessToken, expectedStatus = HttpStatus.CREATED } = options;

    const req = request(this.app.getHttpServer())
      .post('/pack')
      .send(payload ?? undefined) // For testing invalid payloads
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-bff-secret', this.bffSecret);

    return req.expect(expectedStatus);
  }

  async createAssistantPack(options: {
    payload: Partial<CreateAssistantPackDto> | null;
    accessToken: string;
    expectedStatus?: number;
  }): Promise<{
    body: PackResponseDto;
  }> {
    const { payload, accessToken, expectedStatus = HttpStatus.CREATED } = options;

    const req = request(this.app.getHttpServer())
      .post('/pack/assistant')
      .send(payload ?? undefined) // For testing invalid payloads
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-bff-secret', this.bffSecret);

    return req.expect(expectedStatus);
  }

  async getPack(options: { id: string; accessToken: string; expectedStatus?: number }): Promise<{
    body: PackResponseDto;
  }> {
    const { id, accessToken, expectedStatus = HttpStatus.OK } = options;

    const req = request(this.app.getHttpServer())
      .get(`/pack/${id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-bff-secret', this.bffSecret);

    return req.expect(expectedStatus);
  }

  async getPacks(options: { accessToken: string; expectedStatus?: number }): Promise<{
    body: PackResponseDto[];
  }> {
    const { accessToken, expectedStatus = HttpStatus.OK } = options;

    const req = request(this.app.getHttpServer())
      .get('/pack')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-bff-secret', this.bffSecret);

    return req.expect(expectedStatus);
  }

  async updatePack(options: {
    id: string;
    payload: Partial<UpdatePackDto> | null;
    accessToken: string;
    expectedStatus?: number;
  }): Promise<{
    body: PackResponseDto;
  }> {
    const { id, payload, accessToken, expectedStatus = HttpStatus.OK } = options;

    const req = request(this.app.getHttpServer())
      .patch(`/pack/${id}`)
      .send(payload ?? undefined) // For testing invalid payloads
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-bff-secret', this.bffSecret);

    return req.expect(expectedStatus);
  }

  async deletePack(options: { id: string; accessToken: string; expectedStatus?: number }): Promise<{
    body: PackResponseDto;
  }> {
    const { id, accessToken, expectedStatus = HttpStatus.NO_CONTENT } = options;

    const req = request(this.app.getHttpServer())
      .delete(`/pack/${id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-bff-secret', this.bffSecret);

    return req.expect(expectedStatus);
  }

  async clonePack(options: {
    id: string;
    payload: Partial<ClonePackDto> | null;
    accessToken: string;
    expectedStatus?: number;
  }): Promise<{
    body: PackResponseDto;
  }> {
    const { id, payload, accessToken, expectedStatus = HttpStatus.CREATED } = options;

    const req = request(this.app.getHttpServer())
      .post(`/pack/${id}/clone`)
      .send(payload ?? undefined)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-bff-secret', this.bffSecret);

    return req.expect(expectedStatus);
  }

  async getPackDeleteImpact(options: {
    id: string;
    accessToken: string;
    expectedStatus?: number;
  }): Promise<{
    body: PackDeleteImpactDto;
  }> {
    const { id, accessToken, expectedStatus = HttpStatus.OK } = options;

    const req = request(this.app.getHttpServer())
      .get(`/pack/${id}/delete-impact`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-bff-secret', this.bffSecret);

    return req.expect(expectedStatus);
  }
}
