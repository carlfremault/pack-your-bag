import { HttpStatus, INestApplication } from '@nestjs/common';

import request from 'supertest';
import { App } from 'supertest/types';

import { CategoryDeleteImpact } from '@/modules/category/category.service';
import { CategoryResponseDto } from '@/modules/category/dto/category-response.dto';
import { CreateCategoryDto } from '@/modules/category/dto/create-category.dto';
import { UpdateCategoryDto } from '@/modules/category/dto/update-category.dto';

export class CategoryHelpers {
  constructor(
    private readonly app: INestApplication<App>,
    private readonly bffSecret: string,
  ) {}

  get defaultCategoryDto() {
    return {
      name: 'Test Category',
      description: 'Test Description',
      colorCode: '#000000',
    };
  }

  async createCategory(options: {
    payload: Partial<CreateCategoryDto> | null;
    accessToken: string;
    expectedStatus?: number;
  }): Promise<{
    body: CategoryResponseDto;
  }> {
    const { payload, accessToken, expectedStatus = HttpStatus.CREATED } = options;

    const req = request(this.app.getHttpServer())
      .post('/category')
      .send(payload ?? undefined) // For testing invalid payloads
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-bff-secret', this.bffSecret);

    return req.expect(expectedStatus);
  }

  async getCategory(options: {
    id: string;
    accessToken: string;
    expectedStatus?: number;
  }): Promise<{
    body: CategoryResponseDto;
  }> {
    const { id, accessToken, expectedStatus = HttpStatus.OK } = options;

    const req = request(this.app.getHttpServer())
      .get(`/category/${id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-bff-secret', this.bffSecret);

    return req.expect(expectedStatus);
  }

  async getCategories(options: { accessToken: string; expectedStatus?: number }): Promise<{
    body: CategoryResponseDto[];
  }> {
    const { accessToken, expectedStatus = HttpStatus.OK } = options;

    const req = request(this.app.getHttpServer())
      .get('/category')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-bff-secret', this.bffSecret);

    return req.expect(expectedStatus);
  }

  async updateCategory(options: {
    id: string;
    payload: Partial<UpdateCategoryDto> | null;
    accessToken: string;
    expectedStatus?: number;
  }): Promise<{
    body: CategoryResponseDto;
  }> {
    const { id, payload, accessToken, expectedStatus = HttpStatus.OK } = options;

    const req = request(this.app.getHttpServer())
      .patch(`/category/${id}`)
      .send(payload ?? undefined) // For testing invalid payloads
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-bff-secret', this.bffSecret);

    return req.expect(expectedStatus);
  }

  async deleteCategory(options: {
    id: string;
    accessToken: string;
    expectedStatus?: number;
  }): Promise<{
    body: CategoryResponseDto;
  }> {
    const { id, accessToken, expectedStatus = HttpStatus.OK } = options;

    const req = request(this.app.getHttpServer())
      .delete(`/category/${id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-bff-secret', this.bffSecret);

    return req.expect(expectedStatus);
  }

  async getCategoryDeleteImpact(options: {
    id: string;
    accessToken: string;
    expectedStatus?: number;
  }): Promise<{
    body: CategoryDeleteImpact;
  }> {
    const { id, accessToken, expectedStatus = HttpStatus.OK } = options;

    const req = request(this.app.getHttpServer())
      .get(`/category/${id}/delete-impact`)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('x-bff-secret', this.bffSecret);

    return req.expect(expectedStatus);
  }
}
