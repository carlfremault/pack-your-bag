import { Injectable } from '@nestjs/common';

import { Prisma, TokenType, VerificationToken } from '@prisma-client';
import { v7 as uuidv7 } from 'uuid';

import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class VerificationTokenService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertVerificationToken(
    userId: string,
    hashedToken: string,
    expiresAt: Date,
    type: TokenType,
    tx?: Prisma.TransactionClient,
  ): Promise<VerificationToken> {
    const prisma = tx ?? this.prisma;

    return prisma.verificationToken.upsert({
      where: {
        userId_type: {
          userId,
          type,
        },
      },
      update: {
        token: hashedToken,
        expiresAt,
        used: false,
      },
      create: {
        id: uuidv7(),
        token: hashedToken,
        type,
        user: { connect: { id: userId } },
        expiresAt,
        used: false,
      },
    });
  }

  async getVerificationToken(
    params: Prisma.VerificationTokenFindUniqueArgs,
    tx?: Prisma.TransactionClient,
  ): Promise<VerificationToken | null> {
    const prisma = tx ?? this.prisma;
    return prisma.verificationToken.findUnique(params);
  }

  async markTokenAsUsed(tokenId: string, tx?: Prisma.TransactionClient): Promise<void> {
    const prisma = tx ?? this.prisma;
    await prisma.verificationToken.update({
      where: { id: tokenId },
      data: { used: true },
    });
  }
}
