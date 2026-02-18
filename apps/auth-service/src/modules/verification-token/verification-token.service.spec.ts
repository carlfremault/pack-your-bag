import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TokenType } from '@/generated/prisma';
import { PrismaService } from '@/prisma/prisma.service';

import { VerificationTokenService } from './verification-token.service';

describe('VerificationTokenService', () => {
  let service: VerificationTokenService;

  const mockVerificationToken = {
    upsert: vi.fn(),
    findUnique: vi.fn(),
    deleteMany: vi.fn(),
    update: vi.fn(),
  };

  const mockPrismaService = {
    verificationToken: mockVerificationToken,
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerificationTokenService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<VerificationTokenService>(VerificationTokenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('upsertVerificationToken', () => {
    const userId = 'user-abc';
    const hashedToken = 'hashed-token-value';
    const expiresAt = new Date('2026-03-01T00:00:00Z');

    it('should call verificationToken.upsert with correct where, update, and create args', async () => {
      const mockResult = {
        id: 'token-1',
        userId,
        token: hashedToken,
        type: TokenType.ACCOUNT_DELETION_CANCELLATION,
        expiresAt,
        used: false,
      };
      mockVerificationToken.upsert.mockResolvedValue(mockResult);

      const result = await service.upsertVerificationToken(
        userId,
        hashedToken,
        expiresAt,
        TokenType.ACCOUNT_DELETION_CANCELLATION,
      );

      expect(mockVerificationToken.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId_type: { userId, type: TokenType.ACCOUNT_DELETION_CANCELLATION } },
          update: { token: hashedToken, expiresAt, used: false },
          create: expect.objectContaining({
            token: hashedToken,
            type: TokenType.ACCOUNT_DELETION_CANCELLATION,
            expiresAt,
            used: false,
            user: { connect: { id: userId } },
          }) as object,
        }),
      );
      expect(result).toEqual(mockResult);
    });

    it('should use the provided transaction client instead of the injected prisma', async () => {
      const txUpsert = vi.fn().mockResolvedValue({ id: 'token-tx' });
      const tx = { verificationToken: { upsert: txUpsert } } as never;

      await service.upsertVerificationToken(
        userId,
        hashedToken,
        expiresAt,
        TokenType.ACCOUNT_DELETION_CANCELLATION,
        tx,
      );

      expect(txUpsert).toHaveBeenCalled();
      expect(mockVerificationToken.upsert).not.toHaveBeenCalled();
    });
  });

  describe('getVerificationToken', () => {
    it('should call verificationToken.findUnique with the provided params', async () => {
      const mockToken = { id: 'token-1', used: false };
      mockVerificationToken.findUnique.mockResolvedValue(mockToken);

      const params = { where: { id: 'token-1' } };
      const result = await service.getVerificationToken(params);

      expect(mockVerificationToken.findUnique).toHaveBeenCalledWith(params);
      expect(result).toEqual(mockToken);
    });

    it('should return null when the token is not found', async () => {
      mockVerificationToken.findUnique.mockResolvedValue(null);

      const result = await service.getVerificationToken({ where: { id: 'missing' } });

      expect(result).toBeNull();
    });

    it('should use the provided transaction client instead of the injected prisma', async () => {
      const txFindUnique = vi.fn().mockResolvedValue(null);
      const tx = { verificationToken: { findUnique: txFindUnique } } as never;

      await service.getVerificationToken({ where: { id: 'x' } }, tx);

      expect(txFindUnique).toHaveBeenCalled();
      expect(mockVerificationToken.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('deleteVerificationTokens', () => {
    it('should call verificationToken.deleteMany with the provided where clause', async () => {
      mockVerificationToken.deleteMany.mockResolvedValue({ count: 3 });

      const where = { used: true };
      const result = await service.deleteVerificationTokens(where);

      expect(mockVerificationToken.deleteMany).toHaveBeenCalledWith({ where });
      expect(result).toEqual({ count: 3 });
    });

    it('should throw BadRequestException without calling deleteMany when where is an empty object', async () => {
      await expect(service.deleteVerificationTokens({})).rejects.toThrow(BadRequestException);
      expect(mockVerificationToken.deleteMany).not.toHaveBeenCalled();
    });

    it('should use the provided transaction client instead of the injected prisma', async () => {
      const txDeleteMany = vi.fn().mockResolvedValue({ count: 1 });
      const tx = { verificationToken: { deleteMany: txDeleteMany } } as never;

      await service.deleteVerificationTokens({ used: true }, tx);

      expect(txDeleteMany).toHaveBeenCalled();
      expect(mockVerificationToken.deleteMany).not.toHaveBeenCalled();
    });
  });

  describe('markTokenAsUsed', () => {
    it('should call verificationToken.update with used: true for the given token id', async () => {
      mockVerificationToken.update.mockResolvedValue({});

      await service.markTokenAsUsed('token-1');

      expect(mockVerificationToken.update).toHaveBeenCalledWith({
        where: { id: 'token-1' },
        data: { used: true },
      });
    });

    it('should use the provided transaction client instead of the injected prisma', async () => {
      const txUpdate = vi.fn().mockResolvedValue({});
      const tx = { verificationToken: { update: txUpdate } } as never;

      await service.markTokenAsUsed('token-1', tx);

      expect(txUpdate).toHaveBeenCalled();
      expect(mockVerificationToken.update).not.toHaveBeenCalled();
    });

    it('should return void regardless of what Prisma resolves with', async () => {
      mockVerificationToken.update.mockResolvedValue({ id: 'token-1', used: true });

      const result = await service.markTokenAsUsed('token-1');

      expect(result).toBeUndefined();
    });
  });
});
