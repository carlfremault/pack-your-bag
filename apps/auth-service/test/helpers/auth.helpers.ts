import { HttpStatus, INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { Prisma, TokenType } from '@repo/db';

import request, { Response } from 'supertest';
import { App } from 'supertest/types';

import { AuthCredentialsDto } from '@/modules/auth/dto/auth-credentials.dto';
import { AuthForgotPasswordDto } from '@/modules/auth/dto/auth-forgot-password.dto';
import { AuthResendVerificationEmailDto } from '@/modules/auth/dto/auth-resend-verification-email.dto';
import { AuthResetPasswordDto } from '@/modules/auth/dto/auth-reset-password.dto';
import { AuthResponseDto } from '@/modules/auth/dto/auth-response.dto';
import { AuthVerifyEmailDto } from '@/modules/auth/dto/auth-verify-email.dto';
import { CancelDeletionDto } from '@/modules/user/dto/cancel-deletion.dto';
import { PrismaService } from '@/prisma/prisma.service';

export class AuthHelpers {
  constructor(
    private readonly app: INestApplication<App>,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly bffSecret: string,
  ) {}

  get defaultUser() {
    return { email: 'testemail@test.com', password: 'validPassword123' };
  }

  async registerUser(options?: {
    payload?: Partial<AuthCredentialsDto>;
    expectedStatus?: number;
    headers?: Record<string, string>;
  }): Promise<Response> {
    const { payload, expectedStatus = HttpStatus.NO_CONTENT, headers = {} } = options ?? {};

    const req = request(this.app.getHttpServer())
      .post('/auth/register')
      .send(payload ?? this.defaultUser)
      .set('x-bff-secret', this.bffSecret);

    Object.entries(headers).forEach(([key, value]) => {
      req.set(key, value);
    });

    return req.expect(expectedStatus);
  }

  async refreshToken(
    token: string,
    expectedStatus = HttpStatus.OK,
  ): Promise<{
    body: AuthResponseDto;
  }> {
    return request(this.app.getHttpServer())
      .post('/auth/refresh-token')
      .set('Authorization', `Bearer ${token}`)
      .set('x-bff-secret', this.bffSecret)
      .expect(expectedStatus);
  }

  async loginUser(options?: {
    payload?: Partial<AuthCredentialsDto>;
    expectedStatus?: number;
    headers?: Record<string, string>;
  }): Promise<{
    body: AuthResponseDto;
  }> {
    const { payload, expectedStatus = HttpStatus.OK, headers = {} } = options ?? {};

    const req = request(this.app.getHttpServer())
      .post('/auth/login')
      .set('x-bff-secret', this.bffSecret)
      .send(payload ?? this.defaultUser);

    Object.entries(headers).forEach(([key, value]) => {
      req.set(key, value);
    });

    return req.expect(expectedStatus);
  }

  async logoutUser(token: string, expectedStatus = HttpStatus.NO_CONTENT) {
    return request(this.app.getHttpServer())
      .delete('/auth/logout')
      .set('Authorization', `Bearer ${token}`)
      .set('x-bff-secret', this.bffSecret)
      .expect(expectedStatus);
  }

  async logoutAllDevices(token: string, expectedStatus = HttpStatus.NO_CONTENT) {
    return request(this.app.getHttpServer())
      .delete('/auth/logout-all')
      .set('Authorization', `Bearer ${token}`)
      .set('x-bff-secret', this.bffSecret)
      .expect(expectedStatus);
  }

  async deleteUser(options: { token: string; password: string; expectedStatus?: HttpStatus }) {
    const { token, password, expectedStatus = HttpStatus.NO_CONTENT } = options;
    return request(this.app.getHttpServer())
      .post('/user/delete')
      .send({ password })
      .set('Authorization', `Bearer ${token}`)
      .set('x-bff-secret', this.bffSecret)
      .expect(expectedStatus);
  }

  async updatePassword(options: {
    token: string;
    payload: { currentPassword?: string; newPassword?: string };
    expectedStatus?: HttpStatus;
    headers?: Record<string, string>;
  }): Promise<{
    body: AuthResponseDto;
  }> {
    const { token, payload, expectedStatus = HttpStatus.OK, headers = {} } = options;
    const req = request(this.app.getHttpServer())
      .patch(`/auth/update-password`)
      .set('Authorization', `Bearer ${token}`)
      .set('x-bff-secret', this.bffSecret)
      .send(payload);

    Object.entries(headers).forEach(([key, value]) => {
      req.set(key, value);
    });

    return req.expect(expectedStatus);
  }

  async forgotPassword(body: AuthForgotPasswordDto, expectedStatus = HttpStatus.NO_CONTENT) {
    return request(this.app.getHttpServer())
      .post('/auth/forgot-password')
      .send(body)
      .set('x-bff-secret', this.bffSecret)
      .expect(expectedStatus);
  }

  async resetPassword(body: AuthResetPasswordDto, expectedStatus = HttpStatus.NO_CONTENT) {
    return request(this.app.getHttpServer())
      .post('/auth/reset-password')
      .send(body)
      .set('x-bff-secret', this.bffSecret)
      .expect(expectedStatus);
  }

  async cancelAccountDeletion(body: CancelDeletionDto, expectedStatus = HttpStatus.NO_CONTENT) {
    return request(this.app.getHttpServer())
      .post('/user/cancel-deletion')
      .send(body)
      .set('x-bff-secret', this.bffSecret)
      .expect(expectedStatus);
  }

  async verifyEmail(body: AuthVerifyEmailDto, expectedStatus = HttpStatus.NO_CONTENT) {
    return request(this.app.getHttpServer())
      .post('/auth/verify-email')
      .set('x-bff-secret', this.bffSecret)
      .send(body)
      .expect(expectedStatus);
  }

  async resendVerificationEmail(
    body: AuthResendVerificationEmailDto,
    expectedStatus = HttpStatus.NO_CONTENT,
  ) {
    return request(this.app.getHttpServer())
      .post('/auth/resend-verification-email')
      .set('x-bff-secret', this.bffSecret)
      .send(body)
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

  async waitForMostRecentLog(where: Prisma.AuditLogWhereInput, maxAttempts = 20) {
    for (let i = 0; i < maxAttempts; i++) {
      const log = await this.prisma.auditLog.findFirst({ where, orderBy: { createdAt: 'desc' } });
      if (log) return log;
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    throw new Error(`Audit log not found for conditions: ${JSON.stringify(where)}`);
  }

  async findPasswordResetTokenForUserId(userId: string) {
    return this.prisma.verificationToken.findUnique({
      where: {
        userId_type: {
          userId: userId,
          type: TokenType.PASSWORD_RESET,
        },
      },
    });
  }

  async sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  tamperWithToken(token: string) {
    const parts = token.split('.');
    const signature = parts[2] as string;
    const corruptedSignature = 'CorruptedSignature' + signature.substring(20);
    return `${parts[0]}.${parts[1]}.${corruptedSignature}`;
  }

  jwtDecode(token: string) {
    const payload: { jti: string; family: string } | null = this.jwtService.decode(token);
    if (!payload) {
      throw new Error('Failed to decode JWT token');
    }
    return payload;
  }
}
