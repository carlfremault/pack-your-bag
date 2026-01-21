import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Prisma, RefreshToken } from '@prisma-client';

import {
  InvalidSessionException,
  SessionExpiredException,
  TokenReusedException,
} from '@/common/exceptions/auth.exceptions';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class RefreshTokenService {
  private readonly logger = new Logger(RefreshTokenService.name, { timestamp: true });
  private readonly refreshTokenGracePeriod: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.refreshTokenGracePeriod = this.configService.get<number>(
      'AUTH_REFRESH_TOKEN_GRACE_PERIOD_MS',
      15000,
    );
  }

  async createRefreshToken(data: Prisma.RefreshTokenCreateInput): Promise<{ id: string }> {
    return this.prisma.refreshToken.create({ data, select: { id: true } });
  }

  async getRefreshToken(where: Prisma.RefreshTokenWhereUniqueInput): Promise<RefreshToken | null> {
    return this.prisma.refreshToken.findUnique({ where });
  }

  async getLatestRefreshToken(where: Prisma.RefreshTokenWhereInput): Promise<RefreshToken | null> {
    return this.prisma.refreshToken.findFirst({ where, orderBy: { createdAt: 'desc' } });
  }

  async rotateRefreshToken(
    oldTokenId: string,
    data: Prisma.RefreshTokenCreateInput,
  ): Promise<RefreshToken> {
    return this.prisma.$transaction(async (tx) => {
      const newToken = await tx.refreshToken.create({ data });

      await tx.refreshToken.update({
        where: { id: oldTokenId },
        data: {
          isRevoked: true,
          revokedAt: new Date(),
          replacedById: data.id,
        },
      });

      return newToken;
    });
  }

  // - Revoke all tokens of a specific family ("sign out on this device" and after Reuse Attack detection)
  // - Revoke all tokens of a specific user ("sign out on all devices")
  async revokeManyTokens(where: Prisma.RefreshTokenWhereInput): Promise<Prisma.BatchPayload> {
    if (!where || Object.keys(where).length === 0) {
      throw new BadRequestException('A filter must be provided for bulk token revocation.');
    }
    return this.prisma.refreshToken.updateMany({
      where,
      data: {
        isRevoked: true,
        revokedAt: new Date(),
      },
    });
  }

  // For cron job
  async deleteRefreshTokens(where: Prisma.RefreshTokenWhereInput): Promise<Prisma.BatchPayload> {
    if (!where || Object.keys(where).length === 0) {
      throw new BadRequestException('A filter must be provided for bulk token deletion.');
    }
    return this.prisma.refreshToken.deleteMany({ where });
  }

  // Helper functions
  async handleRevokedTokenRequest(
    userId: string,
    storedToken: RefreshToken,
  ): Promise<RefreshToken> {
    const family = storedToken.family;

    if (!storedToken.revokedAt) {
      this.logger.error('Revoked token missing revokedAt timestamp', {
        userId,
        tokenId: storedToken.id,
        family,
      });
      throw new InvalidSessionException('Token state is inconsistent');
    }
    const timeSinceRevocation = Date.now() - storedToken.revokedAt.getTime();
    const isWithinGracePeriod = timeSinceRevocation < this.refreshTokenGracePeriod;

    // Case 1: Handle grace period (race condition)
    if (isWithinGracePeriod) {
      const newerValidToken = await this.getLatestRefreshToken({
        userId,
        family,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      });

      if (newerValidToken) {
        this.logger.warn('Race condition handled', {
          userId: userId,
          revokedToken: storedToken.id,
          validToken: newerValidToken.id,
          family: family,
          timeSinceRevocation,
        });
        return newerValidToken;
      }

      // No valid token found within grace period
      // This means: Manual logout OR token expired OR something went wrong

      if (!storedToken.replacedById) {
        throw new SessionExpiredException(
          'Refresh requested after manual logout, within grace period',
        );
      }

      this.logger.warn('Race condition: Rotated token found but replacement invalid/expired', {
        userId: userId,
        tokenId: storedToken.id,
        replacedById: storedToken.replacedById,
        family: family,
      });
      throw new InvalidSessionException('Rotated token found but replacement invalid/expired');
    }

    // Case 2: Outside grace period
    // Revoke entire family as security measure
    const { count } = await this.revokeManyTokens({ family, isRevoked: false });

    if (storedToken.replacedById) {
      // Token reuse attack: Token was rotated but old one is being used
      this.logger.error('CRITICAL: Token reuse attack detected', {
        userId,
        tokenId: storedToken.id,
        replacedById: storedToken.replacedById,
        family,
        timeSinceRevocation,
        revokedTokenCount: count,
      });
      throw new TokenReusedException();
    }

    throw new SessionExpiredException('Refresh attempt on manually logged-out session');
  }
}
