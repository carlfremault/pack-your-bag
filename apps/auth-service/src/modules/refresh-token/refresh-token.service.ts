import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';

import { Prisma, RefreshToken } from '@prisma-client';

import { REFRESH_TOKEN_GRACE_PERIOD_MS } from '@/common/constants/auth.constants';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class RefreshTokenService {
  private readonly logger = new Logger(RefreshTokenService.name, { timestamp: true });
  constructor(private readonly prisma: PrismaService) {}

  async createRefreshToken(data: Prisma.RefreshTokenCreateInput): Promise<{ id: string }> {
    return await this.prisma.refreshToken.create({ data, select: { id: true } });
  }

  async getRefreshToken(where: Prisma.RefreshTokenWhereUniqueInput): Promise<RefreshToken | null> {
    return await this.prisma.refreshToken.findUnique({ where });
  }

  async getLatestRefreshToken(where: Prisma.RefreshTokenWhereInput): Promise<RefreshToken | null> {
    return await this.prisma.refreshToken.findFirst({ where, orderBy: { createdAt: 'desc' } });
  }

  async rotateRefreshToken(
    oldTokenId: string,
    data: Prisma.RefreshTokenCreateInput,
  ): Promise<RefreshToken> {
    return await this.prisma.$transaction(async (tx) => {
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
    return await this.prisma.refreshToken.updateMany({
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
    return await this.prisma.refreshToken.deleteMany({ where });
  }

  // Helper functions
  async handleRevokedTokenRequest(
    userId: string,
    storedToken: RefreshToken,
  ): Promise<RefreshToken> {
    const family = storedToken.family;
    const requestWithinGracePeriod =
      Date.now() - new Date(storedToken.updatedAt).getTime() < REFRESH_TOKEN_GRACE_PERIOD_MS;

    // Case 1. Race condition
    if (storedToken.isRevoked && requestWithinGracePeriod) {
      const latestValidToken = await this.getLatestRefreshToken({
        userId,
        family,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      });
      if (latestValidToken) {
        this.logger.warn(`Race condition detected: Token in grace period used. userId=${userId}`);
        return latestValidToken;
      }
      this.logger.debug(`Grace period token used but no valid replacement found. userId=${userId}`);
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Case 2. Token reused or expired
    if (storedToken.isRevoked) {
      await this.revokeManyTokens({ family, isRevoked: false });

      if (storedToken.replacedById) {
        this.logger.error(`Security alert: Refresh token reuse detected. userId=${userId}`);
      }
    }

    throw new UnauthorizedException('Session expired');
  }
}
