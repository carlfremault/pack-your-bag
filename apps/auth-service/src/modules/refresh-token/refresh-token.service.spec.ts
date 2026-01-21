import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  InvalidSessionException,
  SessionExpiredException,
  TokenReusedException,
} from '@/common/exceptions/auth.exceptions';
import { PrismaService } from '@/prisma/prisma.service';

import { RefreshTokenService } from './refresh-token.service';

const MOCK_CONFIG = {
  AUTH_REFRESH_TOKEN_GRACE_PERIOD_MS: 2000,
};

describe('RefreshTokenService', () => {
  let service: RefreshTokenService;
  let loggerWarnSpy: ReturnType<typeof vi.spyOn>;
  let loggerErrorSpy: ReturnType<typeof vi.spyOn>;

  const mockConfigService = {
    get: vi.fn(<T = number>(key: string, defaultValue?: T): T => {
      return (MOCK_CONFIG[key as keyof typeof MOCK_CONFIG] ?? defaultValue) as T;
    }),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.setSystemTime(new Date('2026-02-01T12:00:00.000Z'));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenService,
        { provide: PrismaService, useValue: {} },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<RefreshTokenService>(RefreshTokenService);

    loggerWarnSpy = vi.spyOn(service['logger'], 'warn').mockImplementation(() => {});
    loggerErrorSpy = vi.spyOn(service['logger'], 'error').mockImplementation(() => {});
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const msAgo = (ms: number) => new Date(Date.now() - ms);

  describe('rotateRefreshToken', () => {
    it('should create new token and revoke old token in transaction', async () => {
      const mockUserId = 'user-uuid-123';
      const oldTokenId = 'old-token-uuid-123';
      const newTokenData = {
        id: 'new-token-uuid-456',
        family: 'family-uuid-123',
        isRevoked: false,
        revokedAt: null,
        expiresAt: new Date('2026-03-01'),
        user: { connect: { id: mockUserId } },
      };

      const mockNewToken = {
        ...newTokenData,
        replacedById: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: mockUserId,
      };

      const mockCreate = vi.fn().mockResolvedValue(mockNewToken);
      const mockUpdate = vi.fn().mockResolvedValue({});

      service['prisma'].$transaction = vi
        .fn()
        .mockImplementation(async <T>(callback: (tx: unknown) => Promise<T>): Promise<T> => {
          const mockTx = {
            refreshToken: {
              create: mockCreate,
              update: mockUpdate,
            },
          };
          return callback(mockTx);
        });

      const result = await service.rotateRefreshToken(oldTokenId, newTokenData);

      expect(result).toEqual(mockNewToken);
      expect(mockCreate).toHaveBeenCalledWith({ data: newTokenData });
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: oldTokenId },
        data: {
          isRevoked: true,
          revokedAt: expect.any(Date) as Date,
          replacedById: newTokenData.id,
        },
      });
    });
  });

  describe('revokeManyTokens', () => {
    it('should throw BadRequestException when empty filter provided', async () => {
      await expect(service.revokeManyTokens({})).rejects.toThrow(
        new BadRequestException('A filter must be provided for bulk token revocation.'),
      );
    });
  });

  describe('deleteRefreshTokens', () => {
    it('should throw BadRequestException when empty filter provided', async () => {
      await expect(service.deleteRefreshTokens({})).rejects.toThrow(
        new BadRequestException('A filter must be provided for bulk token deletion.'),
      );
    });
  });

  describe('handleRevokedTokenRequest', () => {
    const gracePeriod = mockConfigService.get('AUTH_REFRESH_TOKEN_GRACE_PERIOD_MS') as number;
    const mockUserId = 'user-uuid-123';

    it('should handle race condition refresh token request', async () => {
      const mockStoredRefreshToken = {
        id: 'refresh-token-uuid-123',
        family: 'family-uuid-123',
        isRevoked: true,
        revokedAt: msAgo(1000),
        expiresAt: new Date('2026-02-01'),
        userId: mockUserId,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
        replacedById: null,
      };
      const mockNewerValidToken = {
        id: 'refresh-token-uuid-456',
        family: mockStoredRefreshToken.family,
        isRevoked: false,
        revokedAt: null,
        expiresAt: new Date('2026-03-01'),
        userId: mockStoredRefreshToken.userId,
        createdAt: new Date('2026-02-01'),
        updatedAt: new Date('2026-02-01'),
        replacedById: null,
      };
      const spyOnGetLatestRefreshToken = vi.spyOn(service, 'getLatestRefreshToken');
      spyOnGetLatestRefreshToken.mockResolvedValue(mockNewerValidToken);

      const result = await service.handleRevokedTokenRequest(mockUserId, mockStoredRefreshToken);

      expect(spyOnGetLatestRefreshToken).toHaveBeenCalledWith({
        userId: mockUserId,
        family: mockStoredRefreshToken.family,
        isRevoked: false,
        expiresAt: { gt: expect.any(Date) as Date },
      });
      expect(result).toEqual(mockNewerValidToken);
      expect(loggerWarnSpy).toHaveBeenCalledWith('Race condition handled', {
        userId: mockUserId,
        revokedToken: mockStoredRefreshToken.id,
        validToken: mockNewerValidToken.id,
        family: mockStoredRefreshToken.family,
        timeSinceRevocation: Date.now() - mockStoredRefreshToken.revokedAt.getTime(),
      });
    });

    it('should throw InvalidSessionException if revoked token is missing revokedAt timestamp', async () => {
      const mockStoredRefreshToken = {
        id: 'refresh-token-uuid-123',
        family: 'family-uuid-123',
        isRevoked: true,
        revokedAt: null,
        expiresAt: new Date('2026-02-01'),
        userId: mockUserId,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
        replacedById: null,
      };

      await expect(
        service.handleRevokedTokenRequest(mockUserId, mockStoredRefreshToken),
      ).rejects.toThrow(new InvalidSessionException('Token state is inconsistent'));
      expect(loggerErrorSpy).toHaveBeenCalledWith('Revoked token missing revokedAt timestamp', {
        userId: mockUserId,
        tokenId: mockStoredRefreshToken.id,
        family: mockStoredRefreshToken.family,
      });
    });

    it('should throw SessionExpiredException when manually logged out and request within grace period', async () => {
      const mockStoredRefreshToken = {
        id: 'refresh-token-uuid-123',
        family: 'family-uuid-123',
        isRevoked: true,
        revokedAt: msAgo(1000),
        expiresAt: new Date('2026-02-01'),
        userId: mockUserId,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
        replacedById: null,
      };
      vi.spyOn(service, 'getLatestRefreshToken').mockResolvedValue(null);

      await expect(
        service.handleRevokedTokenRequest(mockUserId, mockStoredRefreshToken),
      ).rejects.toThrow(
        new SessionExpiredException('Refresh requested after manual logout, within grace period'),
      );
    });

    it('should throw InvalidSessionException if request within grace period but replacement token is invalid/expired or not found', async () => {
      const mockStoredRefreshToken = {
        id: 'refresh-token-uuid-123',
        family: 'family-uuid-123',
        isRevoked: true,
        revokedAt: msAgo(1000),
        expiresAt: new Date('2026-02-01'),
        userId: mockUserId,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
        replacedById: 'refresh-token-uuid-456',
      };

      vi.spyOn(service, 'getLatestRefreshToken').mockResolvedValue(null);

      await expect(
        service.handleRevokedTokenRequest(mockUserId, mockStoredRefreshToken),
      ).rejects.toThrow(
        new InvalidSessionException('Rotated token found but replacement invalid/expired'),
      );
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        'Race condition: Rotated token found but replacement invalid/expired',
        {
          userId: mockUserId,
          tokenId: mockStoredRefreshToken.id,
          replacedById: mockStoredRefreshToken.replacedById,
          family: mockStoredRefreshToken.family,
        },
      );
    });

    it('should throw TokenReusedException if a revoked and replaced token used outside of grace period', async () => {
      const mockStoredRefreshToken = {
        id: 'refresh-token-uuid-123',
        family: 'family-uuid-123',
        isRevoked: true,
        revokedAt: msAgo(gracePeriod + 1000),
        expiresAt: new Date('2026-02-01'),
        userId: mockUserId,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
        replacedById: 'refresh-token-uuid-456',
      };
      const spyOnRevokeManyTokens = vi.spyOn(service, 'revokeManyTokens');
      spyOnRevokeManyTokens.mockResolvedValue({ count: 1 });

      await expect(
        service.handleRevokedTokenRequest(mockUserId, mockStoredRefreshToken),
      ).rejects.toThrow(new TokenReusedException());
      expect(spyOnRevokeManyTokens).toHaveBeenCalledWith({
        family: mockStoredRefreshToken.family,
        isRevoked: false,
      });
      expect(loggerErrorSpy).toHaveBeenCalledWith('CRITICAL: Token reuse attack detected', {
        userId: mockStoredRefreshToken.userId,
        tokenId: mockStoredRefreshToken.id,
        replacedById: mockStoredRefreshToken.replacedById,
        family: mockStoredRefreshToken.family,
        timeSinceRevocation: Date.now() - mockStoredRefreshToken.revokedAt.getTime(),
        revokedTokenCount: 1,
      });
    });

    it('should throw SessionExpiredException when manually logged out and request after grace period', async () => {
      const mockStoredRefreshToken = {
        id: 'refresh-token-uuid-123',
        family: 'family-uuid-123',
        isRevoked: true,
        revokedAt: msAgo(gracePeriod + 1000),
        expiresAt: new Date('2026-02-01'),
        userId: mockUserId,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
        replacedById: null,
      };
      const spyOnRevokeManyTokens = vi.spyOn(service, 'revokeManyTokens');
      spyOnRevokeManyTokens.mockResolvedValue({ count: 0 });

      await expect(
        service.handleRevokedTokenRequest(mockUserId, mockStoredRefreshToken),
      ).rejects.toThrow(
        new SessionExpiredException('Refresh attempt on manually logged-out session'),
      );
      expect(spyOnRevokeManyTokens).toHaveBeenCalledWith({
        family: mockStoredRefreshToken.family,
        isRevoked: false,
      });
    });
  });
});
