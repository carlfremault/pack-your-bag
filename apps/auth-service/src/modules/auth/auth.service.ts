import {
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { Prisma } from '@prisma-client';
import bcrypt from 'bcrypt';
import { uuidv7 } from 'uuidv7';

import { AUTH_DEFAULT_USER_ROLE_ID } from '@/common/constants/auth.constants';
import { RefreshTokenService } from '@/modules/refresh-token/refresh-token.service';
import { AuthCredentialsDto } from '@/modules/user/dto/auth-credentials';
import { UserService } from '@/modules/user/user.service';

import { AuthResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name, { timestamp: true });
  private readonly bcryptSaltRounds: number;
  private readonly defaultUserRoleId: number;
  private readonly accessTokenExpiresIn: number;
  private readonly refreshTokenExpiresIn: number;
  private readonly dummyHash: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly userService: UserService,
  ) {
    this.bcryptSaltRounds = Number(this.configService.get<number>('AUTH_BCRYPT_SALT_ROUNDS', 10));
    this.defaultUserRoleId = AUTH_DEFAULT_USER_ROLE_ID;
    this.dummyHash = bcrypt.hashSync('dummy_password_for_timing', this.bcryptSaltRounds);
    this.accessTokenExpiresIn = Number(
      this.configService.get<number>('AUTH_ACCESS_TOKEN_EXPIRATION_IN_SECONDS', 900),
    );
    this.refreshTokenExpiresIn = Number(
      this.configService.get<number>('AUTH_REFRESH_TOKEN_EXPIRATION_IN_SECONDS', 604800),
    );
  }

  async register(body: AuthCredentialsDto): Promise<AuthResponseDto> {
    const { email, password } = body;

    const uuid = uuidv7();
    const hashedPassword = await bcrypt.hash(password, this.bcryptSaltRounds);

    const data: Prisma.UserCreateInput = {
      id: uuid,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: {
        connect: { id: this.defaultUserRoleId },
      },
    };

    const newUser = await this.userService.createUser(data);
    return this.issueRefreshToken(newUser.id, newUser.roleId);
  }

  async login(body: AuthCredentialsDto): Promise<AuthResponseDto> {
    const { email, password } = body;

    const user = await this.userService.getUser({ email: email.toLowerCase() });
    // Perform comparison even if user doesn't exist to prevent timing attacks
    const passwordToCompare = user?.password || this.dummyHash;
    const isPasswordValid = await bcrypt.compare(password, passwordToCompare);

    if (!user || !isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password.');
    }
    return this.issueRefreshToken(user.id, user.roleId);
  }

  async refreshToken(
    userId: string,
    tokenId: string,
    tokenFamilyId: string,
  ): Promise<AuthResponseDto> {
    const user = await this.userService.getUser({ id: userId });
    if (!user) {
      throw new UnauthorizedException('Access Denied');
    }

    const storedToken = await this.refreshTokenService.getRefreshToken({ id: tokenId });
    if (!storedToken) {
      this.logger.warn('Token not found', { tokenId });
      throw new UnauthorizedException('Access Denied');
    }

    if (storedToken.family !== tokenFamilyId || storedToken.userId !== userId) {
      this.logger.error('Token ownership/family mismatch', {
        expectedUserId: userId,
        actualUserId: storedToken.userId,
        expectedFamily: tokenFamilyId,
        actualFamily: storedToken.family,
      });
      throw new UnauthorizedException('Access Denied');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Session expired');
    }

    if (storedToken.isRevoked) {
      const latestValidToken = await this.refreshTokenService.handleRevokedTokenRequest(
        userId,
        storedToken,
      );
      return this.generateJwtResponse(
        userId,
        user.roleId,
        latestValidToken.id,
        latestValidToken.family,
      );
    }

    return this.issueRefreshToken(user.id, user.roleId, tokenId, tokenFamilyId);
  }

  async logout(userId: string, tokenFamilyId: string): Promise<void> {
    await this.refreshTokenService.revokeManyTokens({
      userId,
      family: tokenFamilyId,
      isRevoked: false,
    });
  }

  async logoutAllDevices(userId: string): Promise<void> {
    await this.refreshTokenService.revokeManyTokens({
      isRevoked: false,
      userId,
    });
  }

  // Helper functions
  private async issueRefreshToken(
    userId: string,
    roleId: number,
    existingTokenId?: string,
    existingTokenFamilyId?: string,
  ): Promise<AuthResponseDto> {
    if (
      (existingTokenId && !existingTokenFamilyId) ||
      (!existingTokenId && existingTokenFamilyId)
    ) {
      throw new InternalServerErrorException('Invalid refresh token rotation parameters');
    }

    const tokenFamilyId = existingTokenFamilyId ?? uuidv7();
    const newTokenId = uuidv7();
    const expiresAt = new Date(Date.now() + this.refreshTokenExpiresIn * 1000);

    const refreshTokenData = {
      id: newTokenId,
      family: tokenFamilyId,
      isRevoked: false,
      revokedAt: null,
      expiresAt,
      user: { connect: { id: userId } },
    };

    try {
      if (existingTokenFamilyId && existingTokenId) {
        await this.refreshTokenService.rotateRefreshToken(existingTokenId, refreshTokenData);
      } else {
        await this.refreshTokenService.createRefreshToken(refreshTokenData);
      }
    } catch (error) {
      this.logger.error(`Database persistence failed for user ${userId}`, error);
      throw new InternalServerErrorException('Session creation failed');
    }

    return this.generateJwtResponse(userId, roleId, newTokenId, tokenFamilyId);
  }

  private async generateJwtResponse(
    userId: string,
    roleId: number,
    tokenId: string,
    tokenFamilyId: string,
  ): Promise<AuthResponseDto> {
    const payload = {
      sub: userId,
      role: roleId,
      iat: Math.floor(Date.now() / 1000),
    };

    const refreshPayload = {
      ...payload,
      jti: tokenId,
      family: tokenFamilyId,
    };

    try {
      const [accessToken, refreshToken] = await Promise.all([
        this.jwtService.signAsync(payload),
        this.jwtService.signAsync(refreshPayload, { expiresIn: this.refreshTokenExpiresIn }),
      ]);

      return {
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: 'Bearer',
        expires_in: this.accessTokenExpiresIn,
        user: { id: userId, role: roleId },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('JWT Signing Failed:', { error: errorMessage, userId });
      throw new InternalServerErrorException('Could not generate session');
    }
  }
}
