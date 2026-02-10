import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Prisma, TokenType, User } from '@prisma-client';
import bcrypt from 'bcrypt';

import { InvalidTokenException } from '@/common/exceptions/bad-request.exceptions';
import { DeletedUserHelper } from '@/common/helpers/deleted-user.helper';
import { AuditLogService } from '@/modules/audit-log/audit-log.service';
import { RefreshTokenService } from '@/modules/refresh-token/refresh-token.service';
import { VerificationTokenService } from '@/modules/verification-token/verification-token.service';
import { PrismaService } from '@/prisma/prisma.service';

import { DeleteUserDto } from './dto/delete-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';

interface UserDeletionResult {
  deletedUsers: number;
  deletedTokens: number;
  anonymizedAuditLogs: number;
}

@Injectable()
export class UserService {
  private readonly bcryptSaltRounds: number;
  private readonly deletedUserRetentionDays: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly auditLogService: AuditLogService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly verificationTokenService: VerificationTokenService,
  ) {
    this.bcryptSaltRounds = this.configService.getOrThrow<number>('AUTH_BCRYPT_SALT_ROUNDS');
    this.deletedUserRetentionDays = this.configService.getOrThrow<number>(
      'AUTH_USER_DELETE_RETENTION_DAYS',
    );
  }

  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

  async getUser(where: Prisma.UserWhereUniqueInput): Promise<User | null> {
    return this.prisma.user.findUnique({
      where,
    });
  }

  async getUsers(where: Prisma.UserWhereInput): Promise<User[]> {
    return this.prisma.user.findMany({
      where,
    });
  }

  async updatePassword(userId: string, body: UpdatePasswordDto): Promise<User> {
    const { currentPassword, newPassword } = body;

    if (currentPassword === newPassword) {
      throw new BadRequestException('New password and current password cannot be the same');
    }

    const user = await this.getUser({ id: userId });
    if (!user) throw new NotFoundException('User not found');

    DeletedUserHelper.checkDeletedUser(user, this.deletedUserRetentionDays);

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('Current password does not match');
    }

    return this.prisma.$transaction(async (tx) => {
      return this.updatePasswordAndRevokeTokens(userId, newPassword, tx);
    });
  }

  async resetPasswordWithToken(
    tokenId: string,
    userId: string,
    newPassword: string,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Verify token ownership within the transaction to prevent TOCTOU issues.
      const token = await this.verificationTokenService.getVerificationToken(
        {
          where: {
            id: tokenId,
            userId: userId,
            type: TokenType.PASSWORD_RESET,
            used: false,
          },
        },
        tx,
      );

      if (!token || token.expiresAt < new Date()) {
        throw new InvalidTokenException();
      }
      await this.updatePasswordAndRevokeTokens(userId, newPassword, tx);
      await this.verificationTokenService.markTokenAsUsed(tokenId, tx);
    });
  }

  private async updatePasswordAndRevokeTokens(
    userId: string,
    newPassword: string,
    tx?: Prisma.TransactionClient,
  ): Promise<User> {
    const prisma = tx || this.prisma;
    const hashedPassword = await bcrypt.hash(newPassword, this.bcryptSaltRounds);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    await this.refreshTokenService.revokeManyTokens({ userId }, prisma);
    return updatedUser;
  }

  async softDeleteUser(userId: string, body: DeleteUserDto): Promise<void> {
    const { password } = body;

    const user = await this.getUser({ id: userId });
    if (!user) {
      throw new UnauthorizedException('Access Denied');
    }

    DeletedUserHelper.checkDeletedUser(user, this.deletedUserRetentionDays);

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    await this.prisma.$transaction(async (tx) => {
      await this.refreshTokenService.revokeManyTokens({ userId }, tx);
      await tx.user.update({
        where: { id: userId },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });
    });
  }

  // For cron job only
  async hardDeleteUsers(userIds: string[]): Promise<UserDeletionResult> {
    if (userIds.length === 0) {
      return { deletedUsers: 0, deletedTokens: 0, anonymizedAuditLogs: 0 };
    }

    return this.prisma.$transaction(async (tx) => {
      const { count: deletedTokens } = await this.refreshTokenService.deleteRefreshTokens(
        { userId: { in: userIds } },
        tx,
      );
      const { count: anonymizedAuditLogs } = await this.auditLogService.anonymizeAuditLogs(
        { userId: { in: userIds } },
        tx,
      );
      const { count: deletedUsers } = await tx.user.deleteMany({
        where: { id: { in: userIds } },
      });

      return {
        deletedUsers,
        deletedTokens,
        anonymizedAuditLogs,
      };
    });
  }
}
