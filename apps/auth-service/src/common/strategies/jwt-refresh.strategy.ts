import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';

import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { InvalidSessionException } from '@/common/exceptions/auth.exceptions';

import { JwtPayload } from './dto/jwt-payload.dto';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'refresh') {
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
      passReqToCallback: true,
    });
  }

  validate(
    _req: Request,
    payload: unknown,
  ): { userId: string; tokenId: string; tokenFamilyId: string } {
    const dto = plainToInstance(JwtPayload, payload, { excludeExtraneousValues: true });
    const errors = validateSync(dto);

    if (errors.length > 0 || dto.type !== 'refresh' || !dto.family) {
      throw new InvalidSessionException('Invalid refresh token payload');
    }

    return {
      userId: dto.sub,
      tokenId: dto.jti,
      tokenFamilyId: dto.family,
    };
  }
}
