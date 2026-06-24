import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { TokenType, User } from '@repo/db';
import { AccountDeletedException, MS_PER_DAY } from '@repo/nestjs-common';

import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { beforeEach, describe, expect, it, Mocked, vi } from 'vitest';

import { InvalidTokenException } from '@/common/exceptions/bad-request.exceptions';
import { RefreshTokenService } from '@/modules/refresh-token/refresh-token.service';
import { VerificationTokenService } from '@/modules/verification-token/verification-token.service';
import { PrismaService } from '@/prisma/prisma.service';

import { UserService } from './user.service';
import { UserEventProvider } from './user-event.provider';

vi.mock('bcrypt');
vi.mock('crypto');

const MOCK_CONFIG = {
  AUTH_BCRYPT_SALT_ROUNDS: 4,
  AUTH_USER_DELETE_RETENTION_DAYS: 7,
};

describe('UserService', () => {
  let service: UserService;
  let prisma: PrismaService;
  let mockedPrismaUser: Mocked<PrismaService['user']>;
  const mockedCompare = vi.mocked(bcrypt.compare);
  const mockedHash = vi.mocked(bcrypt.hash);
  const mockedCreateHash = vi.mocked(crypto.createHash);
  const mockedRandomBytes = vi.mocked(crypto.randomBytes);

  const mockConfigService = {
    getOrThrow: vi.fn(<T = number>(key: string, defaultValue?: T): T => {
      const value = MOCK_CONFIG[key as keyof typeof MOCK_CONFIG];
      if (value === undefined && defaultValue === undefined) {
        throw new Error(`Configuration key "${key}" does not exist`);
      }
      return (value ?? defaultValue) as T;
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

  const mockVerificationTokenService = {
    upsertVerificationToken: vi.fn(),
    getVerificationToken: vi.fn(),
    markTokenAsUsed: vi.fn(),
  };

  const mockUserEventProvider = {
    emitAccountDeletionRequested: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RefreshTokenService, useValue: mockRefreshTokenService },
        { provide: VerificationTokenService, useValue: mockVerificationTokenService },
        { provide: UserEventProvider, useValue: mockUserEventProvider },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prisma = module.get<PrismaService>(PrismaService);
    mockedPrismaUser = vi.mocked(prisma.user);

    mockedCompare.mockResolvedValue(true as never);
    mockedHash.mockResolvedValue('new-hashed-val' as never);

    const expectedRawToken = Buffer.from('a'.repeat(64), 'hex').toString('hex');

    const mockHashInstance = {
      update: vi.fn().mockReturnThis(),
      digest: vi.fn().mockReturnValue('hashed_token'),
    };
    mockedCreateHash.mockReturnValue(mockHashInstance as unknown as crypto.Hash);
    mockedRandomBytes.mockImplementation(() => expectedRawToken);
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

      const mockedSaltRounds = mockConfigService.getOrThrow('AUTH_BCRYPT_SALT_ROUNDS');

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

    it("should revoke a user's tokens, soft delete the user, create a verification token and emit an event", async () => {
      const mockUser = {
        id: userId,
        email: 'test@testemail.com',
        password: body.password,
        isDeleted: false,
      } as User;
      mockedPrismaUser.findUnique.mockResolvedValue(mockUser);

      await service.softDeleteUser(userId, body);

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
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
      expect(mockVerificationTokenService.upsertVerificationToken).toHaveBeenCalledWith(
        userId,
        expect.any(String) as string,
        expect.any(Date) as Date,
        TokenType.ACCOUNT_DELETION_CANCELLATION,
        mockPrismaService,
      );
      expect(mockUserEventProvider.emitAccountDeletionRequested).toHaveBeenCalled();
      expect(mockUserEventProvider.emitAccountDeletionRequested).toHaveBeenCalledWith({
        userId,
        cancellationToken: expect.any(String) as string,
        email: mockUser.email,
        cancellationDate: expect.any(String) as string,
      });
    });

    it('should throw an UnauthorizedException if the user is not found', async () => {
      mockedPrismaUser.findUnique.mockResolvedValue(null);
      await expect(service.softDeleteUser(userId, body)).rejects.toThrow(
        new UnauthorizedException('Access Denied'),
      );
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
      expect(mockUserEventProvider.emitAccountDeletionRequested).not.toHaveBeenCalled();
    });

    it('should throw an AccountDeletedException if the user is already scheduled for deletion', async () => {
      const mockUser = {
        id: 'user-123',
        password: 'hashed_password',
        isDeleted: true,
        deletedAt: new Date(),
      } as User;
      mockedPrismaUser.findUnique.mockResolvedValue(mockUser);
      await expect(service.softDeleteUser(userId, body)).rejects.toThrow(AccountDeletedException);
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
      expect(mockUserEventProvider.emitAccountDeletionRequested).not.toHaveBeenCalled();
    });

    it('should throw an UnauthorizedException if the password is incorrect', async () => {
      const mockUser = { password: 'wrongPassword456', isDeleted: false } as User;
      mockedPrismaUser.findUnique.mockResolvedValue(mockUser);
      mockedCompare.mockResolvedValue(false as never);
      await expect(service.softDeleteUser(userId, body)).rejects.toThrow(UnauthorizedException);
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
      expect(mockUserEventProvider.emitAccountDeletionRequested).not.toHaveBeenCalled();
    });
  });

  describe('cancelAccountDeletion', () => {
    const dto = { token: 'token-123', password: 'validPassword123' };
    const mockRetentionPeriod = mockConfigService.getOrThrow(
      'AUTH_USER_DELETE_RETENTION_DAYS',
    ) as number;

    const mockUser = { id: 'user-123', isDeleted: true, deletedAt: new Date() } as User;
    const mockResetRecord = {
      id: 'token-123',
      userId: 'user-123',
      token: 'hashed_token',
      type: TokenType.ACCOUNT_DELETION_CANCELLATION,
      expiresAt: new Date(Date.now() + mockRetentionPeriod * MS_PER_DAY),
      used: false,
    };

    it('should cancel a user account deletion', async () => {
      mockVerificationTokenService.getVerificationToken.mockResolvedValue(mockResetRecord);
      mockedPrismaUser.findUnique.mockResolvedValue(mockUser);

      const result = await service.cancelAccountDeletion(dto);
      expect(result).toEqual({ user: { id: 'user-123' } });

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(mockVerificationTokenService.getVerificationToken).toHaveBeenCalledWith(
        {
          where: {
            token: 'hashed_token',
            type: TokenType.ACCOUNT_DELETION_CANCELLATION,
            used: false,
          },
        },
        mockPrismaService,
      );
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123', isDeleted: true },
      });
      expect(mockedCompare).toHaveBeenCalledWith(dto.password, mockUser.password);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { isDeleted: false, deletedAt: null },
      });
      expect(mockVerificationTokenService.markTokenAsUsed).toHaveBeenCalledWith(
        mockResetRecord.id,
        mockPrismaService,
      );
    });

    it('should throw InvalidTokenException if token is not found or already used', async () => {
      mockVerificationTokenService.getVerificationToken.mockResolvedValue(null);

      await expect(service.cancelAccountDeletion(dto)).rejects.toThrow(InvalidTokenException);
    });

    it('should throw InvalidTokenException if token has expired', async () => {
      mockVerificationTokenService.getVerificationToken.mockResolvedValue({
        ...mockResetRecord,
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(service.cancelAccountDeletion(dto)).rejects.toThrow(InvalidTokenException);
    });

    it('should throw InvalidTokenException if user does not exist or is not marked as deleted', async () => {
      mockVerificationTokenService.getVerificationToken.mockResolvedValue(mockResetRecord);
      mockedPrismaUser.findUnique.mockResolvedValue(null);

      await expect(service.cancelAccountDeletion(dto)).rejects.toThrow(InvalidTokenException);
    });

    it('should throw UnauthorizedException if the password does not match', async () => {
      mockVerificationTokenService.getVerificationToken.mockResolvedValue(mockResetRecord);
      mockedPrismaUser.findUnique.mockResolvedValue({
        id: 'user-123',
        password: 'hashed_password',
      } as User);

      mockedCompare.mockResolvedValueOnce(false as never);

      await expect(service.cancelAccountDeletion(dto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('hardDeleteUsers', () => {
    it("should delete users' refresh tokens and delete the users", async () => {
      const userIds = ['uuid-123', 'uuid-456'];
      const mockResult = { count: 2 };
      mockRefreshTokenService.deleteRefreshTokens.mockResolvedValue(mockResult);
      mockPrismaService.user.deleteMany.mockResolvedValue(mockResult);

      const result = await service.hardDeleteUsers(userIds);

      expect(mockRefreshTokenService.deleteRefreshTokens).toHaveBeenCalledWith(
        { userId: { in: userIds } },
        mockPrismaService,
      );
      expect(mockPrismaService.user.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: ['uuid-123', 'uuid-456'] } },
      });
      expect(result).toEqual({
        deletedUsers: 2,
        deletedTokens: 2,
      });
    });

    it('should not make a database call if no user ids are provided', async () => {
      await service.hardDeleteUsers([]);

      expect(mockRefreshTokenService.deleteRefreshTokens).not.toHaveBeenCalled();
      expect(mockPrismaService.user.deleteMany).not.toHaveBeenCalled();
    });
  });
});
