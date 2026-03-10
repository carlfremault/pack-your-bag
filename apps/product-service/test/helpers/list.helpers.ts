import { HttpStatus, INestApplication } from '@nestjs/common';

import request from 'supertest';
import { App } from 'supertest/types';

import { CreateListDto } from '@/modules/list/dto/create-list.dto';
import { ListResponseDto } from '@/modules/list/dto/list-response.dto';

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
}
