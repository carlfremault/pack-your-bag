import { BadRequestException, Injectable } from '@nestjs/common';

import { Prisma, RefreshToken } from '@prisma-client';

import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class RefreshTokenService {
  constructor(private readonly prisma: PrismaService) {}

  async createRefreshToken(data: Prisma.RefreshTokenCreateInput): Promise<{ id: string }> {
    return await this.prisma.refreshToken.create({ data, select: { id: true } });
  }

  async getRefreshToken(tokenId: string): Promise<RefreshToken | null> {
    return await this.prisma.refreshToken.findUnique({ where: { id: tokenId } });
  }

  async rotateRefreshToken(
    tokenId: string,
    data: Prisma.RefreshTokenCreateInput,
  ): Promise<{ newTokenId: string }> {
    return await this.prisma.$transaction(async (tx) => {
      const { id: newTokenId } = await tx.refreshToken.create({ data, select: { id: true } });

      await tx.refreshToken.update({
        where: { id: tokenId },
        data: {
          isRevoked: true,
          revokedAt: new Date(),
          replacedById: newTokenId,
        },
      });

      return { newTokenId };
    });
  }

  // - Revoke all tokens of a specific family ("sign out on this device")
  // and after Reuse Attack detection
  // - Revoke all tokens of a specific user ("sign out on all devices")
  async revokeManyTokens(where: Prisma.RefreshTokenWhereInput): Promise<Prisma.BatchPayload> {
    if (!where || Object.keys(where).length === 0) {
      throw new BadRequestException(
        'Safe-guard: A specific filter must be provided for bulk revocation.',
      );
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
      throw new BadRequestException(
        'Safe-guard: A specific filter must be provided for bulk deletion.',
      );
    }
    return await this.prisma.refreshToken.deleteMany({ where });
  }
}
