import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

import bcrypt from 'bcrypt';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  InvalidSessionException,
  SessionExpiredException,
} from '@/common/exceptions/auth.exceptions';

import { RefreshTokenService } from '../refresh-token/refresh-token.service';
import { UserService } from '../user/user.service';

import { AuthService } from './auth.service';

const MOCK_CONFIG = {
  AUTH_BCRYPT_SALT_ROUNDS: 4,
  AUTH_DEFAULT_USER_ROLE_ID: 1,
  AUTH_ACCESS_TOKEN_EXPIRATION_IN_SECONDS: 1234,
  AUTH_REFRESH_TOKEN_EXPIRATION_IN_SECONDS: 4321,
} as const;

describe('AuthService', () => {
  let service: AuthService;
  let hashedPassword: string;
  let loggerWarnSpy: ReturnType<typeof vi.spyOn>;
  let loggerErrorSpy: ReturnType<typeof vi.spyOn>;

  const mockUserService = {
    createUser: vi.fn(),
    getUser: vi.fn(),
    updatePassword: vi.fn(),
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

  const mockConfigService = {
    get: vi.fn(<T = number>(key: string, defaultValue?: T): T => {
      return (MOCK_CONFIG[key as keyof typeof MOCK_CONFIG] ?? defaultValue) as T;
    }),
  };

  beforeAll(async () => {
    hashedPassword = await bcrypt.hash(
      'validPassword123',
      mockConfigService.get('AUTH_BCRYPT_SALT_ROUNDS') as number,
    );
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.setSystemTime(new Date('2026-01-01'));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: RefreshTokenService, useValue: mockRefreshTokenService },
        { provide: UserService, useValue: mockUserService },
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
        expires_in: mockConfigService.get('AUTH_ACCESS_TOKEN_EXPIRATION_IN_SECONDS'),
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
        expires_in: mockConfigService.get('AUTH_ACCESS_TOKEN_EXPIRATION_IN_SECONDS'),
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
        mockConfigService.get('AUTH_BCRYPT_SALT_ROUNDS') as number,
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
      const inSevenDays = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
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

      expect(mockUserService.getUser).toHaveBeenCalledWith({ id: refreshTokenUser.userId });
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
        access_token: 'mock-jwt-token',
        refresh_token: 'mock-jwt-token',
        token_type: 'Bearer',
        expires_in: mockConfigService.get('AUTH_ACCESS_TOKEN_EXPIRATION_IN_SECONDS'),
        user: { id: mockUser.id, role: mockUser.roleId },
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
      const inSevenDays = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
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
      const inSevenDays = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
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
      const inSevenDays = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const mockRefreshToken = {
        id: 'token-uuid-456',
        family: refreshTokenUser.tokenFamilyId,
        isRevoked: false,
        expiresAt: inSevenDays,
        userId: refreshTokenUser.userId,
      };

      const mockUser = { id: refreshTokenUser.userId, roleId: 1 };
      mockUserService.getUser.mockResolvedValue({ id: refreshTokenUser.userId, roleId: 1 });
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
        access_token: 'mock-jwt-token',
        refresh_token: 'mock-jwt-token',
        token_type: 'Bearer',
        expires_in: mockConfigService.get('AUTH_ACCESS_TOKEN_EXPIRATION_IN_SECONDS'),
        user: { id: mockUser.id, role: mockUser.roleId },
        auditOverride: 'TOKEN_REFRESHED_RACE_CONDITION',
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
        expires_in: mockConfigService.get('AUTH_ACCESS_TOKEN_EXPIRATION_IN_SECONDS'),
        user: { id: mockUser.id, role: mockUser.roleId },
      });
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
          expiresIn: mockConfigService.get('AUTH_REFRESH_TOKEN_EXPIRATION_IN_SECONDS'),
        }),
      );

      expect(result).toEqual({
        access_token: 'mock-jwt-token',
        refresh_token: 'mock-jwt-token',
        token_type: 'Bearer',
        expires_in: mockConfigService.get('AUTH_ACCESS_TOKEN_EXPIRATION_IN_SECONDS'),
        user: { id: mockUser.id, role: mockUser.roleId },
      });
    });
  });
});
