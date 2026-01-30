import { HttpStatus, INestApplication } from '@nestjs/common';

import request from 'supertest';
import { App } from 'supertest/types';

import { Prisma } from '@/generated/prisma';
import { AuthCredentialsDto } from '@/modules/auth/dto/auth-credentials';
import { AuthResponseDto } from '@/modules/auth/dto/auth-response.dto';
import { PrismaService } from '@/prisma/prisma.service';

interface DeleteUserOptions {
  token: string;
  password: string;
  expectedStatus?: HttpStatus;
}

export class AuthHelpers {
  constructor(
    private readonly app: INestApplication<App>,
    private readonly prisma: PrismaService,
    private readonly bffSecret: string,
  ) {}

  get defaultUser() {
    return { email: 'testemail@test.com', password: 'validPassword123' };
  }

  async registerUser(dto?: AuthCredentialsDto, expectedStatus = HttpStatus.CREATED) {
    const payload = dto ?? this.defaultUser;

    return request(this.app.getHttpServer())
      .post('/auth/register')
      .send(payload)
      .set('x-bff-secret', this.bffSecret)
      .expect(expectedStatus);
  }

  async refreshToken(token: string, expectedStatus = HttpStatus.OK) {
    return request(this.app.getHttpServer())
      .post('/auth/refresh-token')
      .set('Authorization', `Bearer ${token}`)
      .set('x-bff-secret', this.bffSecret)
      .expect(expectedStatus);
  }

  async loginUser(dto?: AuthCredentialsDto, expectedStatus = HttpStatus.OK) {
    const payload = dto ?? this.defaultUser;

    const response = await request(this.app.getHttpServer())
      .post('/auth/login')
      .set('x-bff-secret', this.bffSecret)
      .send(payload)
      .expect(expectedStatus);

    return response.body as AuthResponseDto;
  }

  async deleteUser({ token, password, expectedStatus = HttpStatus.NO_CONTENT }: DeleteUserOptions) {
    return request(this.app.getHttpServer())
      .delete('/user/me')
      .send({ password })
      .set('Authorization', `Bearer ${token}`)
      .set('x-bff-secret', this.bffSecret)
      .expect(expectedStatus);
  }

  async waitForLogs(where: Prisma.AuditLogWhereInput, maxAttempts = 20) {
    for (let i = 0; i < maxAttempts; i++) {
      const logs = await this.prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' } });
      if (logs.length > 0) return logs;
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    throw new Error(`Audit log not found for conditions: ${JSON.stringify(where)}`);
  }
}
