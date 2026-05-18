import * as jwt from 'jsonwebtoken';
import { v7 as uuidv7 } from 'uuid';

export interface TestTokenOptions {
  userId: string;
  roleId?: number;
  isGuest?: boolean;
  expiresIn?: string;
}

export class JwtTestHelper {
  private readonly privateKey: string;
  constructor(privateKeyB64: string) {
    this.privateKey = Buffer.from(privateKeyB64, 'base64').toString('utf8');
  }

  generateAccessToken(options: TestTokenOptions): string {
    const { userId, roleId = 1, isGuest = false, expiresIn = '15m' } = options;

    const payload = {
      sub: userId,
      role: roleId,
      isGuest,
      iat: Math.floor(Date.now() / 1000),
      jti: uuidv7(),
      type: 'access',
    };

    return jwt.sign(payload, this.privateKey, {
      algorithm: 'RS256',
      expiresIn: expiresIn as jwt.SignOptions['expiresIn'],
    });
  }

  generateExpiredToken(options: TestTokenOptions): string {
    const { userId, roleId = 1, isGuest = false } = options;

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      sub: userId,
      role: roleId,
      isGuest,
      iat: now - 3600,
      exp: now - 1, // already expired
      jti: uuidv7(),
      type: 'access',
    };

    return jwt.sign(payload, this.privateKey, {
      algorithm: 'RS256',
    });
  }
}
