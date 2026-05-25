import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

import { AuditEventType, TokenType } from '@repo/db';
import { InvalidSessionException, MS_PER_DAY } from '@repo/nestjs-common';

import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  EmailAlreadyVerifiedException,
  InvalidTokenException,
} from '@/common/exceptions/bad-request.exceptions';
import { EmailNotVerifiedException } from '@/common/exceptions/forbidden.exceptions';
import { SessionExpiredException } from '@/common/exceptions/unauthorized.exceptions';
import { RefreshTokenService } from '@/modules/refresh-token/refresh-token.service';
import { ServiceClientService } from '@/modules/service-client/service-client.service';
import { UserService } from '@/modules/user/user.service';
import { VerificationTokenService } from '@/modules/verification-token/verification-token.service';
import { PrismaService } from '@/prisma/prisma.service';

import { AuthService } from './auth.service';
import { AuthEventProvider } from './auth-event.provider';

const MOCK_CONFIG = {
  AUTH_BCRYPT_SALT_ROUNDS: 4,
  AUTH_USER_DELETE_RETENTION_DAYS: 1,
  AUTH_ACCESS_TOKEN_EXPIRATION_IN_SECONDS: 1234,
  AUTH_REFRESH_TOKEN_EXPIRATION_IN_SECONDS: 4321,
  AUTH_PASSWORD_RESET_TOKEN_EXPIRATION_IN_MS: 5678,
  AUTH_EMAIL_VERIFICATION_TOKEN_EXPIRATION_IN_MS: 91011,
} as const;

vi.mock('crypto');

describe('AuthService', () => {
  let service: AuthService;
  let hashedPassword: string;
  let loggerWarnSpy: ReturnType<typeof vi.spyOn>;
  let loggerErrorSpy: ReturnType<typeof vi.spyOn>;

  const mockedRandomBytes = vi.mocked(crypto.randomBytes);
  const mockedCreateHash = vi.mocked(crypto.createHash);

  const mockUserService = {
    createUser: vi.fn(),
    getUser: vi.fn(),
    updateUser: vi.fn(),
    updatePassword: vi.fn(),
    resetPasswordWithToken: vi.fn(),
  };

  const mockJwtService = {
    signAsync: vi.fn().mockResolvedValue('mock-jwt-token'),
  };

  const mockRefreshTokenService = {
    createRefreshToken: vi.fn(),
    getRefreshToken: vi.fn(),
    rotateRefreshToken: vi.fn(),
    handleRevokedTokenRequest: vi.fn(),
  };

  const mockVerificationTokenService = {
    upsertVerificationToken: vi.fn(),
    getVerificationToken: vi.fn(),
    markTokenAsUsed: vi.fn(),
  };

  const mockServiceClientService = {
    seedGuestData: vi.fn(),
  };

  const mockAuthEventProvider = {
    emitPasswordResetRequested: vi.fn(),
    emitPasswordResetConfirmed: vi.fn(),
    emitAccountVerificationRequested: vi.fn(),
  };

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
      update: vi.fn(),
    },
    $transaction: vi.fn((callback: (tx: typeof mockPrismaService) => Promise<unknown>) => {
      return callback(mockPrismaService);
    }),
  };

  beforeAll(async () => {
    hashedPassword = await bcrypt.hash(
      'validPassword123',
      mockConfigService.getOrThrow('AUTH_BCRYPT_SALT_ROUNDS') as number,
    );
  });

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: RefreshTokenService, useValue: mockRefreshTokenService },
        { provide: VerificationTokenService, useValue: mockVerificationTokenService },
        { provide: UserService, useValue: mockUserService },
        { provide: ServiceClientService, useValue: mockServiceClientService },
        { provide: AuthEventProvider, useValue: mockAuthEventProvider },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    loggerWarnSpy = vi.spyOn(service['logger'], 'warn').mockImplementation(() => {});
    loggerErrorSpy = vi.spyOn(service['logger'], 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const expectedRawToken = Buffer.from('a'.repeat(64), 'hex').toString('hex');

    beforeEach(() => {
      mockedRandomBytes.mockImplementation(() => expectedRawToken);

      const mockHashInstance = {
        update: vi.fn().mockReturnThis(),
        digest: vi.fn().mockReturnValue('hashed_token'),
      };
      mockedCreateHash.mockReturnValue(mockHashInstance as unknown as crypto.Hash);
    });

    it('should create a user with normalized data and return a token pair', async () => {
      const userDto = { email: 'TESTEMAIL@test.com', password: 'validPassword123' };
      const mockUser = { id: 'uuid-123', roleId: 1, email: userDto.email.toLowerCase() };
      mockUserService.createUser.mockResolvedValue(mockUser);

      await service.register(userDto);

      expect(mockUserService.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String) as string,
          email: userDto.email.toLowerCase(),
          password: expect.toSatisfy((hash: string) =>
            bcrypt.compareSync(userDto.password, hash),
          ) as string,
          role: {
            connect: { id: 1 },
          },
          isEmailVerified: false,
          emailVerifiedAt: null,
        }),
      );
      expect(mockVerificationTokenService.upsertVerificationToken).toHaveBeenCalledWith(
        mockUser.id,
        expect.any(String),
        expect.any(Date),
        TokenType.EMAIL_VERIFICATION,
      );
      expect(mockAuthEventProvider.emitAccountVerificationRequested).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          email: userDto.email.toLowerCase(),
          verificationToken: expect.any(String) as string,
        }),
      );
    });
  });

  describe('createGuestSession', () => {
    const expectedRawToken = Buffer.from('a'.repeat(64), 'hex').toString('hex');

    beforeEach(() => {
      mockedRandomBytes.mockImplementation(() => expectedRawToken);
      mockUserService.createUser.mockResolvedValue({ id: 'guest-uuid', roleId: 1, isGuest: true });
      mockServiceClientService.seedGuestData.mockResolvedValue({
        categories: 4,
        items: 14,
        lists: 2,
        packs: 1,
        trips: 1,
      });
    });

    it('should create a guest user with correct properties and return tokens with isGuest true', async () => {
      const result = await service.createGuestSession();

      expect(mockUserService.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: expect.stringMatching(/^guest-.+@guest\.local$/) as string,
          password: expect.toSatisfy((hash: string) => hash.startsWith('$2')) as string,
          role: { connect: { id: 1 } },
          isGuest: true,
          isEmailVerified: true,
          emailVerifiedAt: expect.any(Date) as Date,
          lastActiveAt: expect.any(Date) as Date,
        }),
      );
      expect(mockServiceClientService.seedGuestData).toHaveBeenCalledWith('guest-uuid');
      expect(result).toEqual({
        access_token: 'mock-jwt-token',
        refresh_token: 'mock-jwt-token',
        token_type: 'Bearer',
        expires_in: mockConfigService.getOrThrow('AUTH_ACCESS_TOKEN_EXPIRATION_IN_SECONDS'),
        user: { id: 'guest-uuid', role: 1, isGuest: true },
      });
    });

    it('should return valid tokens even when seedGuestData fails', async () => {
      mockServiceClientService.seedGuestData.mockRejectedValue(new Error('Product service down'));

      const result = await service.createGuestSession();

      expect(result).toEqual(
        expect.objectContaining({
          access_token: 'mock-jwt-token',
          user: { id: 'guest-uuid', role: 1, isGuest: true },
        }),
      );
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Failed to seed guest data',
        expect.objectContaining({ userId: 'guest-uuid', error: 'Product service down' }),
      );
    });

    it('should log with String(error) when seedGuestData throws a non-Error value', async () => {
      mockServiceClientService.seedGuestData.mockRejectedValue('raw string failure');

      await service.createGuestSession();

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Failed to seed guest data',
        expect.objectContaining({ error: 'raw string failure' }),
      );
    });
  });

  describe('login', () => {
    const userDto = { email: 'TESTEMAIL@test.com', password: 'validPassword123' };
    const mockUser = { id: 'uuid-123', roleId: 1, isGuest: false };

    it('should normalize input and return tokens for valid credentials', async () => {
      mockUserService.getUser.mockResolvedValue({
        ...mockUser,
        password: hashedPassword,
        isEmailVerified: true,
      });

      const result = await service.login(userDto);

      expect(mockUserService.getUser).toHaveBeenCalledWith({ email: userDto.email.toLowerCase() });

      expect(mockRefreshTokenService.createRefreshToken).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String) as string,
          family: expect.any(String) as string,
          isRevoked: false,
          revokedAt: null,
          expiresAt: expect.any(Date) as Date,
          user: { connect: { id: mockUser.id } },
        }),
      );

      expect(mockJwtService.signAsync).toHaveBeenCalledTimes(2);

      expect(result).toEqual({
        access_token: 'mock-jwt-token',
        refresh_token: 'mock-jwt-token',
        token_type: 'Bearer',
        expires_in: mockConfigService.getOrThrow('AUTH_ACCESS_TOKEN_EXPIRATION_IN_SECONDS'),
        user: { id: mockUser.id, role: mockUser.roleId, isGuest: false },
      });
    });

    it('should throw UnauthorizedException if user is not found and prevent timing attacks by calling bcrypt.compare with dummy hash', async () => {
      mockUserService.getUser.mockResolvedValue(null);
      const compareSpy = vi.spyOn(bcrypt, 'compare');

      await expect(service.login(userDto)).rejects.toThrow(
        new UnauthorizedException('Invalid email or password'),
      );

      expect(compareSpy).toHaveBeenCalledWith(
        userDto.password,
        expect.stringMatching(/^\$2[ayb]\$.{56}$/),
      );

      compareSpy.mockRestore();
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      const wrongHashedPassword = await bcrypt.hash(
        'differentPassword',
        mockConfigService.getOrThrow('AUTH_BCRYPT_SALT_ROUNDS') as number,
      );
      mockUserService.getUser.mockResolvedValue({ ...mockUser, password: wrongHashedPassword });

      await expect(service.login(userDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw EmailNotVerifiedException if user is not verified', async () => {
      mockUserService.getUser.mockResolvedValue({
        ...mockUser,
        password: hashedPassword,
        isEmailVerified: false,
      });

      await expect(service.login(userDto)).rejects.toThrow(EmailNotVerifiedException);
    });
  });

  describe('refreshToken', () => {
    const refreshTokenUser = {
      userId: 'user-uuid-123',
      tokenId: 'token-uuid-123',
      tokenFamilyId: 'family-uuid-123',
    };

    it('should return new tokens for valid refresh token', async () => {
      const inSevenDays = new Date(Date.now() + 7 * MS_PER_DAY);
      const mockRefreshToken = {
        id: 'token-uuid-456',
        family: refreshTokenUser.tokenFamilyId,
        isRevoked: false,
        expiresAt: inSevenDays,
        userId: refreshTokenUser.userId,
      };

      const mockUser = { id: refreshTokenUser.userId, roleId: 1, isGuest: false };
      mockUserService.getUser.mockResolvedValue(mockUser);
      mockRefreshTokenService.getRefreshToken.mockResolvedValue(mockRefreshToken);

      const result = await service.refreshToken(refreshTokenUser);

      expect(mockUserService.getUser).toHaveBeenCalledWith({
        id: refreshTokenUser.userId,
        isDeleted: false,
      });
      expect(mockRefreshTokenService.getRefreshToken).toHaveBeenCalledWith({
        id: refreshTokenUser.tokenId,
      });
      expect(mockRefreshTokenService.rotateRefreshToken).toHaveBeenCalledWith(
        refreshTokenUser.tokenId,
        expect.objectContaining({
          id: expect.any(String) as string,
          family: refreshTokenUser.tokenFamilyId,
          isRevoked: false,
          revokedAt: null,
          expiresAt: expect.any(Date) as Date,
          user: { connect: { id: refreshTokenUser.userId } },
        }),
      );

      expect(mockJwtService.signAsync).toHaveBeenCalledTimes(2);

      expect(result).toEqual({
        data: {
          access_token: 'mock-jwt-token',
          refresh_token: 'mock-jwt-token',
          token_type: 'Bearer',
          expires_in: mockConfigService.getOrThrow('AUTH_ACCESS_TOKEN_EXPIRATION_IN_SECONDS'),
          user: { id: mockUser.id, role: mockUser.roleId, isGuest: false },
        },
      });
    });

    it('should throw UnauthorizedException if user is not found', async () => {
      mockUserService.getUser.mockResolvedValue(null);

      await expect(service.refreshToken(refreshTokenUser)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw InvalidSessionException if refresh token is not found', async () => {
      mockUserService.getUser.mockResolvedValue({ id: refreshTokenUser.userId, roleId: 1 });
      mockRefreshTokenService.getRefreshToken.mockResolvedValue(null);

      await expect(service.refreshToken(refreshTokenUser)).rejects.toThrow(
        new InvalidSessionException('Token not found in DB'),
      );

      expect(loggerWarnSpy).toHaveBeenCalledWith('Token not found in DB', {
        userId: refreshTokenUser.userId,
        tokenId: refreshTokenUser.tokenId,
      });
    });

    it('should throw InvalidSessionException if there is a token familyId mismatch', async () => {
      const inSevenDays = new Date(Date.now() + 7 * MS_PER_DAY);
      const mockRefreshToken = {
        id: 'token-uuid-456',
        family: refreshTokenUser.tokenFamilyId,
        isRevoked: false,
        expiresAt: inSevenDays,
        userId: refreshTokenUser.userId,
      };

      mockUserService.getUser.mockResolvedValue({ id: refreshTokenUser.userId, roleId: 1 });
      mockRefreshTokenService.getRefreshToken.mockResolvedValue({
        ...mockRefreshToken,
        family: 'family-uuid-456',
      });

      await expect(service.refreshToken(refreshTokenUser)).rejects.toThrow(
        new InvalidSessionException('Token ownership/family mismatch'),
      );

      expect(loggerErrorSpy).toHaveBeenCalledWith('Token ownership/family mismatch', {
        expectedUserId: refreshTokenUser.userId,
        actualUserId: refreshTokenUser.userId,
        expectedFamily: refreshTokenUser.tokenFamilyId,
        actualFamily: 'family-uuid-456',
      });
    });

    it('should throw InvalidSessionException if there is a token userId mismatch', async () => {
      const inSevenDays = new Date(Date.now() + 7 * MS_PER_DAY);
      const mockRefreshToken = {
        id: 'token-uuid-456',
        family: refreshTokenUser.tokenFamilyId,
        isRevoked: false,
        expiresAt: inSevenDays,
        userId: refreshTokenUser.userId,
      };
      mockUserService.getUser.mockResolvedValue({ id: refreshTokenUser.userId, roleId: 1 });
      mockRefreshTokenService.getRefreshToken.mockResolvedValue({
        ...mockRefreshToken,
        userId: 'user-uuid-456',
      });

      await expect(service.refreshToken(refreshTokenUser)).rejects.toThrow(
        new InvalidSessionException('Token ownership/family mismatch'),
      );

      expect(loggerErrorSpy).toHaveBeenCalledWith('Token ownership/family mismatch', {
        expectedUserId: refreshTokenUser.userId,
        actualUserId: 'user-uuid-456',
        expectedFamily: refreshTokenUser.tokenFamilyId,
        actualFamily: refreshTokenUser.tokenFamilyId,
      });
    });

    it('should throw SessionExpiredException if refresh token is expired', async () => {
      const mockRefreshToken = {
        id: 'token-uuid-456',
        family: refreshTokenUser.tokenFamilyId,
        isRevoked: false,
        expiresAt: new Date('2000-01-01'),
        userId: refreshTokenUser.userId,
      };
      mockUserService.getUser.mockResolvedValue({ id: refreshTokenUser.userId, roleId: 1 });
      mockRefreshTokenService.getRefreshToken.mockResolvedValue(mockRefreshToken);

      await expect(service.refreshToken(refreshTokenUser)).rejects.toThrow(
        new SessionExpiredException('Refresh token expired in DB'),
      );
    });

    it('should handle revoked token with race condition recovery', async () => {
      const inSevenDays = new Date(Date.now() + 7 * MS_PER_DAY);
      const mockRefreshToken = {
        id: 'token-uuid-456',
        family: refreshTokenUser.tokenFamilyId,
        isRevoked: false,
        expiresAt: inSevenDays,
        userId: refreshTokenUser.userId,
      };

      const mockUser = { id: refreshTokenUser.userId, roleId: 1, isGuest: false };
      mockUserService.getUser.mockResolvedValue(mockUser);

      const mockRevokedToken = {
        ...mockRefreshToken,
        isRevoked: true,
      };
      mockRefreshTokenService.getRefreshToken.mockResolvedValue(mockRevokedToken);
      mockRefreshTokenService.handleRevokedTokenRequest.mockResolvedValue({
        id: mockRefreshToken.id,
        family: mockRefreshToken.family,
      });

      const result = await service.refreshToken(refreshTokenUser);

      expect(mockRefreshTokenService.handleRevokedTokenRequest).toHaveBeenCalledWith(
        refreshTokenUser.userId,
        mockRevokedToken,
      );
      expect(result).toEqual({
        data: {
          access_token: 'mock-jwt-token',
          refresh_token: 'mock-jwt-token',
          token_type: 'Bearer',
          expires_in: mockConfigService.getOrThrow('AUTH_ACCESS_TOKEN_EXPIRATION_IN_SECONDS'),
          user: { id: mockUser.id, role: mockUser.roleId, isGuest: false },
        },
        auditOverride: AuditEventType.TOKEN_REFRESHED_RACE_CONDITION,
      });
    });

    describe('guest user', () => {
      const inSevenDays = new Date(Date.now() + 7 * MS_PER_DAY);

      const guestMockUser = { id: refreshTokenUser.userId, roleId: 1, isGuest: true };
      const guestMockRefreshToken = {
        id: 'token-uuid-456',
        family: refreshTokenUser.tokenFamilyId,
        isRevoked: false,
        expiresAt: inSevenDays,
        userId: refreshTokenUser.userId,
      };

      it('should update lastActiveAt for a guest user on successful refresh', async () => {
        mockUserService.getUser.mockResolvedValue(guestMockUser);
        mockRefreshTokenService.getRefreshToken.mockResolvedValue(guestMockRefreshToken);
        mockUserService.updateUser.mockResolvedValue(undefined);

        const result = await service.refreshToken(refreshTokenUser);

        expect(mockUserService.updateUser).toHaveBeenCalledWith(
          { id: refreshTokenUser.userId },
          { lastActiveAt: expect.any(Date) as Date },
        );
        expect(result.data.user).toEqual(expect.objectContaining({ isGuest: true }));
      });

      it('should not throw when lastActiveAt update fails for a guest user', async () => {
        mockUserService.getUser.mockResolvedValue(guestMockUser);
        mockRefreshTokenService.getRefreshToken.mockResolvedValue(guestMockRefreshToken);
        mockUserService.updateUser.mockRejectedValueOnce(new Error('DB write failed'));

        const result = await service.refreshToken(refreshTokenUser);

        expect(result.data).toEqual(expect.objectContaining({ access_token: 'mock-jwt-token' }));

        await new Promise(process.nextTick);

        expect(loggerWarnSpy).toHaveBeenCalledWith(
          'Failed to update lastActiveAt for guest',
          expect.objectContaining({ userId: refreshTokenUser.userId }),
        );
      });

      it('should not update lastActiveAt for a non-guest user on refresh', async () => {
        const nonGuestMockUser = { id: refreshTokenUser.userId, roleId: 1, isGuest: false };
        mockUserService.getUser.mockResolvedValue(nonGuestMockUser);
        mockRefreshTokenService.getRefreshToken.mockResolvedValue(guestMockRefreshToken);

        await service.refreshToken(refreshTokenUser);

        expect(mockUserService.updateUser).not.toHaveBeenCalled();
      });
    });
  });

  describe('updatePasswordAndReauthenticate', () => {
    it('should call updatePassword and issue a new token pair', async () => {
      const userId = 'user-uuid-123';
      const body = { currentPassword: 'currentPassword123', newPassword: 'newPassword123' };
      const mockUser = { id: userId, roleId: 1, isGuest: false };
      mockUserService.updatePassword.mockResolvedValue(mockUser);

      const result = await service.updatePasswordAndReauthenticate(userId, body);

      expect(mockUserService.updatePassword).toHaveBeenCalledWith(userId, body);
      expect(result).toEqual({
        access_token: 'mock-jwt-token',
        refresh_token: 'mock-jwt-token',
        token_type: 'Bearer',
        expires_in: mockConfigService.getOrThrow('AUTH_ACCESS_TOKEN_EXPIRATION_IN_SECONDS'),
        user: { id: mockUser.id, role: mockUser.roleId, isGuest: false },
      });
    });
  });

  describe('forgotPassword', () => {
    const expectedRawToken = Buffer.from('a'.repeat(64), 'hex').toString('hex');

    beforeEach(() => {
      mockedRandomBytes.mockImplementation(() => expectedRawToken);

      const mockHashInstance = {
        update: vi.fn().mockReturnThis(),
        digest: vi.fn().mockReturnValue('hashed_token'),
      };
      mockedCreateHash.mockReturnValue(mockHashInstance as unknown as crypto.Hash);
    });

    it('should create reset token and emit event for existing user', async () => {
      const dto = { email: 'testemail@test.com' };

      const mockUser = {
        id: 'user-123',
        email: 'testemail@test.com',
        password: 'hashed_password',
        roleId: 1,
        isDeleted: false,
      };

      mockUserService.getUser.mockResolvedValue(mockUser);
      mockVerificationTokenService.upsertVerificationToken.mockResolvedValue(undefined);

      await service.forgotPassword(dto);

      expect(mockUserService.getUser).toHaveBeenCalledWith({
        email: 'testemail@test.com',
      });

      expect(mockVerificationTokenService.upsertVerificationToken).toHaveBeenCalledWith(
        'user-123',
        'hashed_token',
        expect.any(Date) as Date,
        TokenType.PASSWORD_RESET,
      );

      expect(mockAuthEventProvider.emitPasswordResetRequested).toHaveBeenCalledWith({
        userId: mockUser.id,
        email: mockUser.email,
        resetToken: expect.any(String) as string,
      });
    });

    it('should normalize email to lowercase', async () => {
      const dto = { email: 'TestEMAIL@Test.COM' };

      mockUserService.getUser.mockResolvedValue(null);

      await service.forgotPassword(dto);

      expect(mockUserService.getUser).toHaveBeenCalledWith({
        email: 'testemail@test.com',
      });
    });

    it('should return silently for deleted or non-existent user', async () => {
      const dto = { email: 'nonexistent@test.com' };

      mockUserService.getUser.mockResolvedValue(null);

      await expect(service.forgotPassword(dto)).resolves.toBeUndefined();

      expect(mockVerificationTokenService.upsertVerificationToken).not.toHaveBeenCalled();
      expect(mockAuthEventProvider.emitPasswordResetRequested).not.toHaveBeenCalled();
    });

    it('should hash the reset token before storing', async () => {
      const dto = { email: 'testemail@test.com' };
      const mockUser = {
        id: 'user-123',
        email: 'testemail@test.com',
        password: 'hashed_password',
        roleId: 1,
        isDeleted: false,
      };

      mockUserService.getUser.mockResolvedValue(mockUser);

      await service.forgotPassword(dto);

      expect(mockedCreateHash).toHaveBeenCalledWith('sha256');
      expect(mockVerificationTokenService.upsertVerificationToken).toHaveBeenCalledWith(
        'user-123',
        'hashed_token',
        expect.any(Date) as Date,
        TokenType.PASSWORD_RESET,
      );

      expect(mockAuthEventProvider.emitPasswordResetRequested).toHaveBeenCalledWith(
        expect.objectContaining({
          resetToken: expectedRawToken,
        }),
      );
    });

    it('should set correct expiration time', async () => {
      const passwordResetTokenExpiresInMS = mockConfigService.getOrThrow(
        'AUTH_PASSWORD_RESET_TOKEN_EXPIRATION_IN_MS',
      ) as number;
      const dto = { email: 'testemail@test.com' };

      const mockUser = {
        id: 'user-123',
        email: 'testemail@test.com',
        password: 'hashed_password',
        roleId: 1,
        isDeleted: false,
      };

      mockUserService.getUser.mockResolvedValue(mockUser);

      const beforeTime = Date.now();
      await service.forgotPassword(dto);
      const afterTime = Date.now();

      const firstCall = mockVerificationTokenService.upsertVerificationToken.mock.calls[0];
      if (!firstCall) {
        throw new Error('upsertVerificationToken was not called');
      }
      const expiresAt = firstCall[2] as Date;

      const expectedMinExpiry = beforeTime + passwordResetTokenExpiresInMS;
      const expectedMaxExpiry = afterTime + passwordResetTokenExpiresInMS;

      expect(expiresAt.getTime()).toBeGreaterThanOrEqual(expectedMinExpiry);
      expect(expiresAt.getTime()).toBeLessThanOrEqual(expectedMaxExpiry);
    });
  });

  describe('resetPassword', () => {
    beforeEach(() => {
      const mockHashInstance = {
        update: vi.fn().mockReturnThis(),
        digest: vi.fn().mockReturnValue('hashed_token'),
      };
      mockedCreateHash.mockReturnValue(mockHashInstance as unknown as crypto.Hash);
    });

    it('should reset password with valid token', async () => {
      const passwordResetTokenExpiresInMS = mockConfigService.getOrThrow(
        'AUTH_PASSWORD_RESET_TOKEN_EXPIRATION_IN_MS',
      ) as number;
      const dto = {
        token: 'valid_reset_token',
        password: 'validPassword123',
      };

      const mockResetRecord = {
        id: 'token-123',
        userId: 'user-123',
        token: 'hashed_token',
        type: TokenType.PASSWORD_RESET,
        expiresAt: new Date(Date.now() + passwordResetTokenExpiresInMS),
        used: false,
      };

      const mockUser = {
        id: 'user-123',
        email: 'testemail@test.com',
        password: 'old_hashed_password',
        roleId: 1,
        isDeleted: false,
      };

      mockVerificationTokenService.getVerificationToken.mockResolvedValue(mockResetRecord);
      mockUserService.getUser.mockResolvedValue(mockUser);
      mockUserService.resetPasswordWithToken.mockResolvedValue(undefined);

      await service.resetPassword(dto);

      expect(mockedCreateHash).toHaveBeenCalledWith('sha256');

      expect(mockVerificationTokenService.getVerificationToken).toHaveBeenCalledWith({
        where: {
          token: 'hashed_token',
          type: TokenType.PASSWORD_RESET,
          used: false,
        },
      });

      expect(mockUserService.getUser).toHaveBeenCalledWith({ id: 'user-123' });

      expect(mockUserService.resetPasswordWithToken).toHaveBeenCalledWith(
        'token-123',
        'user-123',
        'validPassword123',
      );

      expect(mockAuthEventProvider.emitPasswordResetConfirmed).toHaveBeenCalledWith({
        userId: 'user-123',
        email: 'testemail@test.com',
        resetTimestamp: expect.any(String) as string,
      });
    });

    it('should throw InvalidTokenException for non-existent token', async () => {
      const dto = {
        token: 'invalid_token',
        password: 'validPassword123',
      };

      mockVerificationTokenService.getVerificationToken.mockResolvedValue(null);

      await expect(service.resetPassword(dto)).rejects.toThrow(InvalidTokenException);

      expect(mockUserService.resetPasswordWithToken).not.toHaveBeenCalled();
      expect(mockAuthEventProvider.emitPasswordResetConfirmed).not.toHaveBeenCalled();
    });

    it('should throw InvalidTokenException for expired token', async () => {
      const dto = {
        token: 'expired_token',
        password: 'validPassword123',
      };

      const mockExpiredRecord = {
        id: 'token-123',
        userId: 'user-123',
        token: 'hashed_token',
        type: TokenType.PASSWORD_RESET,
        expiresAt: new Date(Date.now() - 1000),
        used: false,
      };

      mockVerificationTokenService.getVerificationToken.mockResolvedValue(mockExpiredRecord);

      await expect(service.resetPassword(dto)).rejects.toThrow(InvalidTokenException);

      expect(mockUserService.resetPasswordWithToken).not.toHaveBeenCalled();
      expect(mockAuthEventProvider.emitPasswordResetConfirmed).not.toHaveBeenCalled();
    });

    it('should throw InvalidTokenException if user does not exist', async () => {
      const dto = {
        token: 'valid_token',
        password: 'validPassword123',
      };

      const mockResetRecord = {
        id: 'token-123',
        userId: 'user-123',
        token: 'hashed_token',
        type: TokenType.PASSWORD_RESET,
        expiresAt: new Date(Date.now() + 3600000),
        used: false,
      };

      mockVerificationTokenService.getVerificationToken.mockResolvedValue(mockResetRecord);
      mockUserService.getUser.mockResolvedValue(null);

      await expect(service.resetPassword(dto)).rejects.toThrow(InvalidTokenException);

      expect(mockUserService.resetPasswordWithToken).not.toHaveBeenCalled();
      expect(mockAuthEventProvider.emitPasswordResetConfirmed).not.toHaveBeenCalled();
    });
  });

  describe('verifyEmail', () => {
    const mockVerificationRecord = {
      id: 'token-123',
      userId: 'user-123',
      token: 'hashed_token',
      type: TokenType.EMAIL_VERIFICATION,
      expiresAt: new Date(Date.now() + 3600000),
      used: false,
    };

    it('should verify email with valid token', async () => {
      const dto = { token: 'valid_token' };
      mockVerificationTokenService.getVerificationToken.mockResolvedValue(mockVerificationRecord);
      mockUserService.getUser.mockResolvedValue({
        id: 'user-123',
        email: 'testemail@test.com',
        password: 'hashed_password',
        roleId: 1,
        isEmailVerified: false,
      });
      await service.verifyEmail(dto);

      expect(mockPrismaService.$transaction).toHaveBeenCalledOnce();
      expect(mockVerificationTokenService.getVerificationToken).toHaveBeenCalledWith(
        {
          where: {
            token: 'hashed_token',
            type: TokenType.EMAIL_VERIFICATION,
          },
        },
        mockPrismaService,
      );
      expect(mockUserService.getUser).toHaveBeenCalledWith({ id: 'user-123' }, mockPrismaService);
      expect(mockUserService.updateUser).toHaveBeenCalledWith(
        {
          id: 'user-123',
        },
        {
          isEmailVerified: true,
          emailVerifiedAt: expect.any(Date) as Date,
        },
        mockPrismaService,
      );
      expect(mockVerificationTokenService.markTokenAsUsed).toHaveBeenCalledWith(
        'token-123',
        mockPrismaService,
      );
    });

    it('should throw InvalidTokenException if token is not found', async () => {
      const dto = { token: 'invalid_token' };
      mockVerificationTokenService.getVerificationToken.mockResolvedValue(null);

      await expect(service.verifyEmail(dto)).rejects.toThrow(InvalidTokenException);
    });

    it('should throw InvalidTokenException if token is expired', async () => {
      const dto = { token: 'expired_token' };
      mockVerificationTokenService.getVerificationToken.mockResolvedValue({
        ...mockVerificationRecord,
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(service.verifyEmail(dto)).rejects.toThrow(InvalidTokenException);
    });

    it('should throw InvalidTokenException if user does not exist', async () => {
      const dto = { token: 'valid_token' };
      mockVerificationTokenService.getVerificationToken.mockResolvedValue(mockVerificationRecord);
      mockUserService.getUser.mockResolvedValue(null);

      await expect(service.verifyEmail(dto)).rejects.toThrow(InvalidTokenException);
    });

    it('should throw InvalidTokenException if user is deleted', async () => {
      const dto = { token: 'valid_token' };
      mockVerificationTokenService.getVerificationToken.mockResolvedValue(mockVerificationRecord);
      mockUserService.getUser.mockResolvedValue({
        id: 'user-123',
        email: 'testemail@test.com',
        password: 'hashed_password',
        roleId: 1,
        isDeleted: true,
      });

      await expect(service.verifyEmail(dto)).rejects.toThrow(InvalidTokenException);
    });

    it('should throw EmailAlreadyVerifiedException if token is used and email is verified', async () => {
      const dto = { token: 'valid_token' };
      mockVerificationTokenService.getVerificationToken.mockResolvedValue({
        ...mockVerificationRecord,
        used: true,
      });
      mockUserService.getUser.mockResolvedValue({
        id: 'user-123',
        email: 'testemail@test.com',
        password: 'hashed_password',
        roleId: 1,
        isEmailVerified: true,
        isDeleted: false,
      });

      await expect(service.verifyEmail(dto)).rejects.toThrow(EmailAlreadyVerifiedException);
    });

    it('should throw InvalidTokenException if token is used but email is not verified', async () => {
      const dto = { token: 'valid_token' };
      mockVerificationTokenService.getVerificationToken.mockResolvedValue({
        ...mockVerificationRecord,
        used: true,
      });
      mockUserService.getUser.mockResolvedValue({
        id: 'user-123',
        email: 'testemail@test.com',
        password: 'hashed_password',
        roleId: 1,
        isEmailVerified: false,
        isDeleted: false,
      });

      await expect(service.verifyEmail(dto)).rejects.toThrow(InvalidTokenException);
    });

    it('should throw InvalidTokenException if token is used and user is deleted', async () => {
      const dto = { token: 'valid_token' };
      mockVerificationTokenService.getVerificationToken.mockResolvedValue({
        ...mockVerificationRecord,
        used: true,
      });
      mockUserService.getUser.mockResolvedValue({
        id: 'user-123',
        email: 'testemail@test.com',
        password: 'hashed_password',
        roleId: 1,
        isDeleted: true,
      });

      await expect(service.verifyEmail(dto)).rejects.toThrow(InvalidTokenException);
    });

    it('should throw InvalidTokenException if token is used and user does not exist', async () => {
      const dto = { token: 'valid_token' };
      mockVerificationTokenService.getVerificationToken.mockResolvedValue({
        ...mockVerificationRecord,
        used: true,
      });
      mockUserService.getUser.mockResolvedValue(null);

      await expect(service.verifyEmail(dto)).rejects.toThrow(InvalidTokenException);
    });
  });

  describe('resendVerificationEmail', () => {
    const expectedRawToken = Buffer.from('a'.repeat(64), 'hex').toString('hex');

    beforeEach(() => {
      mockedRandomBytes.mockImplementation(() => expectedRawToken);

      const mockHashInstance = {
        update: vi.fn().mockReturnThis(),
        digest: vi.fn().mockReturnValue('hashed_token'),
      };
      mockedCreateHash.mockReturnValue(mockHashInstance as unknown as crypto.Hash);
    });

    it('should resend verification email if user is not verified', async () => {
      const dto = { email: 'testemail@test.com' };
      const mockUser = {
        id: 'user-123',
        email: 'testemail@test.com',
        password: 'hashed_password',
        roleId: 1,
        isEmailVerified: false,
      };
      mockUserService.getUser.mockResolvedValue(mockUser);

      await service.resendVerificationEmail(dto);

      expect(mockVerificationTokenService.upsertVerificationToken).toHaveBeenCalledWith(
        mockUser.id,
        'hashed_token',
        expect.any(Date),
        TokenType.EMAIL_VERIFICATION,
      );
      expect(mockAuthEventProvider.emitAccountVerificationRequested).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          email: mockUser.email,
          verificationToken: expectedRawToken,
        }),
      );
    });

    it('should return silently if user is verified', async () => {
      const dto = { email: 'testemail@test.com' };
      const mockUser = {
        id: 'user-123',
        email: 'testemail@test.com',
        password: 'hashed_password',
        roleId: 1,
        isEmailVerified: true,
      };
      mockUserService.getUser.mockResolvedValue(mockUser);

      await service.resendVerificationEmail(dto);

      expect(mockVerificationTokenService.upsertVerificationToken).not.toHaveBeenCalled();
      expect(mockAuthEventProvider.emitAccountVerificationRequested).not.toHaveBeenCalled();
    });

    it('should return silently if user does not exist', async () => {
      const dto = { email: 'testemail@test.com' };
      mockUserService.getUser.mockResolvedValue(null);

      await service.resendVerificationEmail(dto);
      expect(mockVerificationTokenService.upsertVerificationToken).not.toHaveBeenCalled();
    });
  });

  describe('JWT token generation (common for login/refreshToken/updatePassword)', () => {
    it('should generate access token and refresh token with correct payload structure and consistent token IDs', async () => {
      const userDto = { email: 'TESTEMAIL@test.com', password: 'validPassword123' };
      const mockUser = {
        id: 'uuid-123',
        roleId: 1,
        isGuest: false,
        password: hashedPassword,
        isEmailVerified: true,
      };
      mockUserService.getUser.mockResolvedValue(mockUser);

      let capturedNewTokenId: string | undefined;
      mockRefreshTokenService.createRefreshToken.mockImplementationOnce(
        (refreshTokenData: { id: string }) => {
          capturedNewTokenId = refreshTokenData.id;
          return Promise.resolve();
        },
      );

      const result = await service.login(userDto);

      expect(mockJwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: mockUser.id,
          role: mockUser.roleId,
          iat: expect.any(Number) as number,
        }),
      );
      expect(capturedNewTokenId).toBeDefined();
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: mockUser.id,
          jti: capturedNewTokenId,
          family: expect.any(String) as string,
        }),
        expect.objectContaining({
          expiresIn: mockConfigService.getOrThrow('AUTH_REFRESH_TOKEN_EXPIRATION_IN_SECONDS'),
        }),
      );

      expect(result).toEqual({
        access_token: 'mock-jwt-token',
        refresh_token: 'mock-jwt-token',
        token_type: 'Bearer',
        expires_in: mockConfigService.getOrThrow('AUTH_ACCESS_TOKEN_EXPIRATION_IN_SECONDS'),
        user: { id: mockUser.id, role: mockUser.roleId, isGuest: false },
      });
    });
  });
});
