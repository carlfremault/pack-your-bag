import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';

import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtAuthStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const publicKey = Buffer.from(
      configService.getOrThrow<string>('RSA_PUBLIC_KEY_B64'),
      'base64',
    ).toString('utf8');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: publicKey,
      algorithms: ['RS256'],
    });
  }

  validate(payload: { sub: string; role: number }) {
    if (!payload.sub || payload.role === undefined || payload.role === null) {
      throw new UnauthorizedException({
        message: 'Invalid access token payload',
        error: 'INVALID_TOKEN',
      });
    }
    return { userId: payload.sub, roleId: payload.role };
  }
}
