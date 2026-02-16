import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Prisma, TokenType, User } from '@prisma-client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

import { DEFAULT_LOCALE, MS_PER_DAY } from '@/common/constants/auth.constants';
import { InvalidTokenException } from '@/common/exceptions/bad-request.exceptions';
import { DeletedUserHelper } from '@/common/helpers/deleted-user.helper';
import { formatLocaleDate } from '@/common/utils/formatLocaleDate';
import { generateToken } from '@/common/utils/generateToken';
import { AuditLogService } from '@/modules/audit-log/audit-log.service';
import { RefreshTokenService } from '@/modules/refresh-token/refresh-token.service';
import { VerificationTokenService } from '@/modules/verification-token/verification-token.service';
import { PrismaService } from '@/prisma/prisma.service';

import { CancelDeletionDto } from './dto/cancel-deletion.dto';
import { DeleteUserDto } from './dto/delete-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UserEventProvider } from './user-event.provider';

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
    private readonly userEventProvider: UserEventProvider,
  ) {
    this.bcryptSaltRounds = this.configService.getOrThrow<number>('AUTH_BCRYPT_SALT_ROUNDS');
    this.deletedUserRetentionDays = this.configService.getOrThrow<number>(
      'AUTH_USER_DELETE_RETENTION_DAYS',
    );
  }

  // ============================================
  // BASIC CRUD OPERATIONS
  // ============================================

  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

  async getUser(
    where: Prisma.UserWhereUniqueInput,
    tx?: Prisma.TransactionClient,
  ): Promise<User | null> {
    const prisma = tx ?? this.prisma;

    return prisma.user.findUnique({
      where,
    });
  }

  async getUsers(where: Prisma.UserWhereInput): Promise<User[]> {
    return this.prisma.user.findMany({
      where,
    });
  }

  async updateUser(
    where: Prisma.UserWhereUniqueInput,
    data: Prisma.UserUpdateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<User> {
    const prisma = tx ?? this.prisma;

    return prisma.user.update({
      where,
      data,
    });
  }

  // ============================================
  // PASSWORD MANAGEMENT
  // ============================================

  async updatePassword(userId: string, body: UpdatePasswordDto): Promise<User> {
    const { currentPassword, newPassword } = body;

    return this.prisma.$transaction(async (tx) => {
      return this.updatePasswordInternal(userId, currentPassword, newPassword, tx);
    });
  }

  async resetPasswordWithToken(
    tokenId: string,
    userId: string,
    newPassword: string,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Verify token ownership again within the transaction to prevent TOCTOU issues (Time-of-check to Time-of-use).
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

  private async updatePasswordInternal(
    userId: string,
    currentPassword: string,
    newPassword: string,
    tx: Prisma.TransactionClient,
  ): Promise<User> {
    if (currentPassword === newPassword) {
      throw new BadRequestException('New password and current password cannot be the same');
    }

    const user = await this.getUser({ id: userId }, tx);
    if (!user) throw new NotFoundException('User not found');
    DeletedUserHelper.checkDeletedUser(user, this.deletedUserRetentionDays);

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('Current password does not match');
    }

    return this.updatePasswordAndRevokeTokens(userId, newPassword, tx);
  }

  private async updatePasswordAndRevokeTokens(
    userId: string,
    newPassword: string,
    tx?: Prisma.TransactionClient,
  ): Promise<User> {
    const prisma = tx ?? this.prisma;
    const hashedPassword = await bcrypt.hash(newPassword, this.bcryptSaltRounds);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    await this.refreshTokenService.revokeManyTokens({ userId }, prisma);
    return updatedUser;
  }

  // ============================================
  // ACCOUNT DELETION
  // ============================================

  async softDeleteUser(userId: string, body: DeleteUserDto): Promise<void> {
    const { password, locale = DEFAULT_LOCALE } = body;

    const user = await this.getUser({ id: userId });
    if (!user) {
      throw new UnauthorizedException('Access Denied');
    }

    DeletedUserHelper.checkDeletedUser(user, this.deletedUserRetentionDays);

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    const { token: cxlToken, hashedToken: hashedCancellationToken } = generateToken();
    const expiresAt = new Date(Date.now() + this.deletedUserRetentionDays * MS_PER_DAY);

    let eventData;
    await this.prisma.$transaction(async (tx) => {
      await this.refreshTokenService.revokeManyTokens({ userId }, tx);
      await tx.user.update({
        where: { id: userId },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });
      await this.verificationTokenService.upsertVerificationToken(
        user.id,
        hashedCancellationToken,
        expiresAt,
        TokenType.ACCOUNT_DELETION_CANCELLATION,
        tx,
      );

      eventData = {
        userId,
        cancellationToken: cxlToken,
        email: user.email,
        cancellationDate: formatLocaleDate(expiresAt, locale),
      };
    });

    if (eventData) this.userEventProvider.emitAccountDeletionRequested(eventData);
  }

  async cancelAccountDeletion(body: CancelDeletionDto): Promise<void> {
    const { token, currentPassword, newPassword } = body;
    const hash = crypto.createHash('sha256').update(token).digest('hex');

    return this.prisma.$transaction(async (tx) => {
      const resetRecord = await this.verificationTokenService.getVerificationToken(
        {
          where: {
            token: hash,
            type: TokenType.ACCOUNT_DELETION_CANCELLATION,
            used: false,
          },
        },
        tx,
      );

      if (!resetRecord || resetRecord.expiresAt < new Date()) {
        throw new InvalidTokenException();
      }

      const user = await this.getUser({ id: resetRecord.userId }, tx);
      if (!user) {
        throw new InvalidTokenException();
      }

      await this.updateUser({ id: user.id }, { isDeleted: false, deletedAt: null }, tx);
      await this.updatePasswordInternal(user.id, currentPassword, newPassword, tx);
      await this.verificationTokenService.markTokenAsUsed(resetRecord.id, tx);
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
