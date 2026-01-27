import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { BffGuard } from '@/common/guards/bff.guard';
import { CustomThrottlerGuard } from '@/common/guards/custom-throttler.guard';
import { JwtAuthStrategy } from '@/common/strategies/jwt-auth.strategy';
import { JwtRefreshStrategy } from '@/common/strategies/jwt-refresh.strategy';
import { RefreshTokenModule } from '@/modules/refresh-token/refresh-token.module';
import { UserModule } from '@/modules/user/user.module';

import { AuditLogModule } from '../audit-log/audit-log.module';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    AuditLogModule,
    UserModule,
    RefreshTokenModule,
    PassportModule,
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const base64PrivateKey = config.get<string>('RSA_PRIVATE_KEY_B64');
        if (!base64PrivateKey) {
          throw new Error('Private key is not defined in environment variables');
        }
        const base64PublicKey = config.get<string>('RSA_PUBLIC_KEY_B64');
        if (!base64PublicKey) {
          throw new Error('Public key is not defined in environment variables');
        }

        return {
          privateKey: Buffer.from(base64PrivateKey, 'base64').toString('utf8'),
          publicKey: Buffer.from(base64PublicKey, 'base64').toString('utf8'),
          signOptions: {
            expiresIn: '1h',
            algorithm: 'RS256',
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthStrategy, JwtRefreshStrategy, CustomThrottlerGuard, BffGuard],
})
export class AuthModule {}
