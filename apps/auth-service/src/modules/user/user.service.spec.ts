import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { User } from '@prisma-client';
import bcrypt from 'bcrypt';
import { beforeEach, describe, expect, it, Mocked, vi } from 'vitest';

import { AuditLogService } from '@/modules/audit-log/audit-log.service';
import { RefreshTokenService } from '@/modules/refresh-token/refresh-token.service';
import { PrismaService } from '@/prisma/prisma.service';

import { UserService } from './user.service';

vi.mock('bcrypt');

const MOCK_CONFIG = {
  AUTH_BCRYPT_SALT_ROUNDS: 4,
};

describe('UserService', () => {
  let service: UserService;
  let prisma: PrismaService;
  let mockedPrismaUser: Mocked<PrismaService['user']>;
  const mockedCompare = vi.mocked(bcrypt.compare);
  const mockedHash = vi.mocked(bcrypt.hash);

  const mockConfigService = {
    get: vi.fn(<T = number>(key: string, defaultValue?: T): T => {
      return (MOCK_CONFIG[key as keyof typeof MOCK_CONFIG] ?? defaultValue) as T;
    }),
  };

  const mockPrismaService = {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    refreshToken: {
      updateMany: vi.fn(),
    },
    $transaction: vi.fn((callback: (tx: typeof mockPrismaService) => Promise<User>) => {
      return callback(mockPrismaService);
    }),
  };

  const mockRefreshTokenService = {
    revokeManyTokens: vi.fn(),
    deleteRefreshTokens: vi.fn(),
  };

  const mockAuditLogService = {
    anonymizeAuditLogs: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuditLogService, useValue: mockAuditLogService },
        { provide: RefreshTokenService, useValue: mockRefreshTokenService },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prisma = module.get<PrismaService>(PrismaService);
    mockedPrismaUser = vi.mocked(prisma.user);

    mockedCompare.mockResolvedValue(true as never);
    mockedHash.mockResolvedValue('new-hashed-val' as never);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('update password', () => {
    const userId = 'uuid-123';
    const validDto = { currentPassword: 'currentPassword123', newPassword: 'newPassword456' };
    const mockUser = { password: 'hashed-old-pass' } as User;

    it('should call update with correct params and return the updated user upon success', async () => {
      mockedPrismaUser.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(mockUser); // Return the updated user
      mockPrismaService.refreshToken.updateMany.mockResolvedValue({ count: 1 });

      const mockedSaltRounds = mockConfigService.get('AUTH_BCRYPT_SALT_ROUNDS');

      const result = await service.updatePassword(userId, validDto);
      expect(mockedCompare).toHaveBeenCalledWith(validDto.currentPassword, mockUser.password);
      expect(mockedHash).toHaveBeenCalledWith(validDto.newPassword, mockedSaltRounds);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { password: 'new-hashed-val' },
      });
      expect(mockRefreshTokenService.revokeManyTokens).toHaveBeenCalledWith(
        { userId },
        mockPrismaService,
      );
      expect(result).toEqual(mockUser);
    });

    it('should throw BadRequestException if new password is identical to current password', async () => {
      const identicalDto = {
        currentPassword: 'currentPassword123',
        newPassword: 'currentPassword123',
      };

      await expect(service.updatePassword(userId, identicalDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.user.findUnique).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if user does not exist in database', async () => {
      mockedPrismaUser.findUnique.mockResolvedValue(null);

      await expect(service.updatePassword(userId, validDto)).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if bcrypt.compare fails (i.e. current password is incorrect)', async () => {
      mockedPrismaUser.findUnique.mockResolvedValue(mockUser);
      mockedCompare.mockResolvedValue(false as never);

      await expect(service.updatePassword(userId, validDto)).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
    });
  });

  describe('softDeleteUser', () => {
    const userId = 'uuid-123';
    const body = { password: 'validPassword123' };

    it("should revoke a user's tokens and soft delete the user", async () => {
      const mockUser = { password: body.password, isDeleted: false } as User;
      mockedPrismaUser.findUnique.mockResolvedValue(mockUser);

      await service.softDeleteUser(userId, body);

      expect(mockRefreshTokenService.revokeManyTokens).toHaveBeenCalledWith(
        {
          userId,
        },
        mockPrismaService,
      );
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { isDeleted: true, deletedAt: expect.any(Date) as Date },
      });
    });

    it('should throw an UnauthorizedException if the user is not found', async () => {
      mockedPrismaUser.findUnique.mockResolvedValue(null);
      await expect(service.softDeleteUser(userId, body)).rejects.toThrow(
        new UnauthorizedException('Access Denied'),
      );
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });

    it('should throw a BadRequestException if the user is already scheduled for deletion', async () => {
      const mockUser = { isDeleted: true } as User;
      mockedPrismaUser.findUnique.mockResolvedValue(mockUser);
      await expect(service.softDeleteUser(userId, body)).rejects.toThrow(
        new BadRequestException('Account already scheduled for deletion'),
      );
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });

    it('should throw an UnauthorizedException if the password is incorrect', async () => {
      const mockUser = { password: 'wrongPassword456', isDeleted: false } as User;
      mockedPrismaUser.findUnique.mockResolvedValue(mockUser);
      mockedCompare.mockResolvedValue(false as never);
      await expect(service.softDeleteUser(userId, body)).rejects.toThrow(UnauthorizedException);
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('hardDeleteUsers', () => {
    it("should delete users' refresh tokens, anonymize their audit logs and delete the users", async () => {
      const userIds = ['uuid-123', 'uuid-456'];
      const mockResult = { count: 2 };
      mockRefreshTokenService.deleteRefreshTokens.mockResolvedValue(mockResult);
      mockAuditLogService.anonymizeAuditLogs.mockResolvedValue(mockResult);
      mockPrismaService.user.deleteMany.mockResolvedValue(mockResult);

      const result = await service.hardDeleteUsers(userIds);

      expect(mockRefreshTokenService.deleteRefreshTokens).toHaveBeenCalledWith(
        { userId: { in: userIds } },
        mockPrismaService,
      );
      expect(mockAuditLogService.anonymizeAuditLogs).toHaveBeenCalledWith(
        { userId: { in: userIds } },
        mockPrismaService,
      );
      expect(mockPrismaService.user.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: ['uuid-123', 'uuid-456'] } },
      });
      expect(result).toEqual({
        deletedUsers: 2,
        deletedTokens: 2,
        anonymizedAuditLogs: 2,
      });
    });

    it('should not make a database call if no user ids are provided', async () => {
      await service.hardDeleteUsers([]);

      expect(mockRefreshTokenService.deleteRefreshTokens).not.toHaveBeenCalled();
      expect(mockAuditLogService.anonymizeAuditLogs).not.toHaveBeenCalled();
      expect(mockPrismaService.user.deleteMany).not.toHaveBeenCalled();
    });
  });
});
