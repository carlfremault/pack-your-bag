import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { MS_PER_DAY } from '@/common/constants/auth.constants';
import { InvalidTokenException } from '@/common/exceptions/bad-request.exceptions';
import {
  InvalidSessionException,
  SessionExpiredException,
} from '@/common/exceptions/unauthorized.exceptions';
import { AuditEventType, TokenType } from '@/generated/prisma';
import { RefreshTokenService } from '@/modules/refresh-token/refresh-token.service';
import { UserService } from '@/modules/user/user.service';
import { VerificationTokenService } from '@/modules/verification-token/verification-token.service';

import { AuthService } from './auth.service';
import { AuthEventProvider } from './auth-event.provider';

const MOCK_CONFIG = {
  AUTH_BCRYPT_SALT_ROUNDS: 4,
  AUTH_USER_DELETE_RETENTION_DAYS: 1,
  AUTH_ACCESS_TOKEN_EXPIRATION_IN_SECONDS: 1234,
  AUTH_REFRESH_TOKEN_EXPIRATION_IN_SECONDS: 4321,
  AUTH_PASSWORD_RESET_TOKEN_EXPIRATION_IN_MS: 5678,
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
  };

  const mockAuthEventProvider = {
    emitPasswordResetRequested: vi.fn(),
    emitPasswordResetConfirmed: vi.fn(),
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
        { provide: JwtService, useValue: mockJwtService },
        { provide: RefreshTokenService, useValue: mockRefreshTokenService },
        { provide: VerificationTokenService, useValue: mockVerificationTokenService },
        { provide: UserService, useValue: mockUserService },
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
    it('should create a user with normalized data and return a token pair', async () => {
      const userDto = { email: 'TESTEMAIL@test.com', password: 'validPassword123' };
      const mockUser = { id: 'uuid-123', roleId: 1 };
      mockUserService.createUser.mockResolvedValue(mockUser);

      const result = await service.register(userDto);

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
        }),
      );

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
        user: { id: mockUser.id, role: mockUser.roleId },
      });
    });
  });

  describe('login', () => {
    const userDto = { email: 'TESTEMAIL@test.com', password: 'validPassword123' };
    const mockUser = { id: 'uuid-123', roleId: 1 };

    it('should normalize input and return tokens for valid credentials', async () => {
      mockUserService.getUser.mockResolvedValue({ ...mockUser, password: hashedPassword });

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
        user: { id: mockUser.id, role: mockUser.roleId },
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

      const mockUser = { id: refreshTokenUser.userId, roleId: 1 };
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
          user: { id: mockUser.id, role: mockUser.roleId },
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

      const mockUser = { id: refreshTokenUser.userId, roleId: 1 };
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
          user: { id: mockUser.id, role: mockUser.roleId },
        },
        auditOverride: AuditEventType.TOKEN_REFRESHED_RACE_CONDITION,
      });
    });
  });

  describe('updatePasswordAndReauthenticate', () => {
    it('should call updatePassword and issue a new token pair', async () => {
      const userId = 'user-uuid-123';
      const body = { currentPassword: 'currentPassword123', newPassword: 'newPassword123' };
      const mockUser = { id: userId, roleId: 1 };
      mockUserService.updatePassword.mockResolvedValue(mockUser);

      const result = await service.updatePasswordAndReauthenticate(userId, body);

      expect(mockUserService.updatePassword).toHaveBeenCalledWith(userId, body);
      expect(result).toEqual({
        access_token: 'mock-jwt-token',
        refresh_token: 'mock-jwt-token',
        token_type: 'Bearer',
        expires_in: mockConfigService.getOrThrow('AUTH_ACCESS_TOKEN_EXPIRATION_IN_SECONDS'),
        user: { id: mockUser.id, role: mockUser.roleId },
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
        isDeleted: false,
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
        isDeleted: false,
      });
    });

    it('should return silently for deleted or non-existent user (timing-safe)', async () => {
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

    it('should throw InvalidTokenException if user is deleted', async () => {
      const passwordResetTokenExpiresInMS = mockConfigService.getOrThrow(
        'AUTH_PASSWORD_RESET_TOKEN_EXPIRATION_IN_MS',
      ) as number;
      const dto = {
        token: 'valid_token',
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

      const mockDeletedUser = {
        id: 'user-123',
        email: 'testemail@test.com',
        password: 'hashed_password',
        roleId: 1,
        isDeleted: true,
      };

      mockVerificationTokenService.getVerificationToken.mockResolvedValue(mockResetRecord);
      mockUserService.getUser.mockResolvedValue(mockDeletedUser);

      await expect(service.resetPassword(dto)).rejects.toThrow(InvalidTokenException);

      expect(mockUserService.resetPasswordWithToken).not.toHaveBeenCalled();
      expect(mockAuthEventProvider.emitPasswordResetConfirmed).not.toHaveBeenCalled();
    });
  });

  describe('JWT token generation (common for register/login/refreshToken/updatePassword)', () => {
    it('should generate access token and refresh token with correct payload structure and consistent token IDs', async () => {
      const userDto = { email: 'TESTEMAIL@test.com', password: 'validPassword123' };
      const mockUser = { id: 'uuid-123', roleId: 1 };
      mockUserService.createUser.mockResolvedValue(mockUser);

      let capturedNewTokenId: string | undefined;
      mockRefreshTokenService.createRefreshToken.mockImplementationOnce(
        (refreshTokenData: { id: string }) => {
          capturedNewTokenId = refreshTokenData.id;
          return Promise.resolve();
        },
      );

      const result = await service.register(userDto);

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
        user: { id: mockUser.id, role: mockUser.roleId },
      });
    });
  });
});
