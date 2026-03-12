import { HttpStatus, INestApplication } from '@nestjs/common';

import request from 'supertest';
import { App } from 'supertest/types';

import { CreateListDto } from '@/modules/list/dto/create-list.dto';
import { ListDeleteImpactDto } from '@/modules/list/dto/list-delete-impact.dto';
import { ListResponseDto } from '@/modules/list/dto/list-response.dto';
import { UpdateListDto } from '@/modules/list/dto/update-list.dto';

export class ListHelpers {
  constructor(
    private readonly app: INestApplication<App>,
    private readonly bffSecret: string,
  ) {}

  get defaultListDto() {
    return {
      name: 'Test List',
      description: 'Test Description',
      colorCode: '#000000',
    };
  }

  async createList(options: {
    payload: Partial<CreateListDto> | null;
    accessToken: string;
    expectedStatus?: number;
  }): Promise<{
    body: ListResponseDto;
  }> {
    const { payload, accessToken, expectedStatus = HttpStatus.CREATED } = options;

    const req = request(this.app.getHttpServer())
      .post('/list')
      .send(payload ?? undefined) // For testing invalid payloads
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-bff-secret', this.bffSecret);

    return req.expect(expectedStatus);
  }

  async getList(options: { id: string; accessToken: string; expectedStatus?: number }): Promise<{
    body: ListResponseDto;
  }> {
    const { id, accessToken, expectedStatus = HttpStatus.OK } = options;

    const req = request(this.app.getHttpServer())
      .get(`/list/${id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-bff-secret', this.bffSecret);

    return req.expect(expectedStatus);
  }

  async getLists(options: { accessToken: string; expectedStatus?: number }): Promise<{
    body: ListResponseDto[];
  }> {
    const { accessToken, expectedStatus = HttpStatus.OK } = options;

    const req = request(this.app.getHttpServer())
      .get('/list')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-bff-secret', this.bffSecret);

    return req.expect(expectedStatus);
  }

  async updateList(options: {
    id: string;
    payload: Partial<UpdateListDto> | null;
    accessToken: string;
    expectedStatus?: number;
  }): Promise<{
    body: ListResponseDto;
  }> {
    const { id, payload, accessToken, expectedStatus = HttpStatus.OK } = options;

    const req = request(this.app.getHttpServer())
      .patch(`/list/${id}`)
      .send(payload ?? undefined) // For testing invalid payloads
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-bff-secret', this.bffSecret);

    return req.expect(expectedStatus);
  }

  async deleteList(options: { id: string; accessToken: string; expectedStatus?: number }): Promise<{
    body: ListResponseDto;
  }> {
    const { id, accessToken, expectedStatus = HttpStatus.OK } = options;

    const req = request(this.app.getHttpServer())
      .delete(`/list/${id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-bff-secret', this.bffSecret);

    return req.expect(expectedStatus);
  }

  async getListDeleteImpact(options: {
    id: string;
    accessToken: string;
    expectedStatus?: number;
  }): Promise<{
    body: ListDeleteImpactDto;
  }> {
    const { id, accessToken, expectedStatus = HttpStatus.OK } = options;

    const req = request(this.app.getHttpServer())
      .get(`/list/${id}/delete-impact`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-bff-secret', this.bffSecret);

    return req.expect(expectedStatus);
  }
}
