import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';

import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { InvalidSessionException } from '@/common/exceptions/auth.exceptions';

import { JwtPayload } from './dto/jwt-payload.dto';

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

  validate(payload: unknown): { userId: string; roleId: number } {
    const dto = plainToInstance(JwtPayload, payload, { excludeExtraneousValues: true });
    const errors = validateSync(dto);

    if (errors.length > 0 || dto.type !== 'access') {
      throw new InvalidSessionException('Invalid access token payload');
    }
    return { userId: dto.sub, roleId: dto.role };
  }
}
