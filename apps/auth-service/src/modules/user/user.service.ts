import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Prisma, User } from '@prisma-client';
import bcrypt from 'bcrypt';

import { DeletedUserHelper } from '@/common/helpers/deleted-user.helper';
import { AuditLogService } from '@/modules/audit-log/audit-log.service';
import { RefreshTokenService } from '@/modules/refresh-token/refresh-token.service';
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

    const hashedPassword = await bcrypt.hash(newPassword, this.bcryptSaltRounds);
    return this.prisma.$transaction(async (tx) => {
      // Update Password
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      // Revoke all active tokens for this user
      await this.refreshTokenService.revokeManyTokens({ userId }, tx);

      return updatedUser;
    });
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
