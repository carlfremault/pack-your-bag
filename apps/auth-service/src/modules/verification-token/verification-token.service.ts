import { Injectable } from '@nestjs/common';

import { Prisma, VerificationToken } from '@prisma-client';

import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class VerificationTokenService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertVerificationToken(
    where: Prisma.VerificationTokenWhereUniqueInput,
    update: Prisma.VerificationTokenUpdateInput,
    create: Prisma.VerificationTokenCreateInput,
  ): Promise<{ id: string }> {
    return this.prisma.verificationToken.upsert({ where, update, create });
  }

  async getVerificationToken(
    params: Prisma.VerificationTokenFindUniqueArgs,
    tx?: Prisma.TransactionClient,
  ): Promise<VerificationToken | null> {
    const prisma = tx || this.prisma;
    return prisma.verificationToken.findUnique(params);
  }

  async markTokenAsUsed(tokenId: string, tx?: Prisma.TransactionClient): Promise<void> {
    const prisma = tx || this.prisma;
    await prisma.verificationToken.update({
      where: { id: tokenId },
      data: { used: true },
    });
  }
}
