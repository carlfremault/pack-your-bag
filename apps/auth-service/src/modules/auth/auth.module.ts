import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { RMQ_PUBLISHERS, RMQ_QUEUES, RmqPublisherModule } from '@repo/nestjs-common';

import { JwtRefreshStrategy } from '@/common/strategies/jwt-refresh.strategy';
import { EmailModule } from '@/modules/email/email.module';
import { RefreshTokenModule } from '@/modules/refresh-token/refresh-token.module';
import { UserModule } from '@/modules/user/user.module';
import { VerificationTokenModule } from '@/modules/verification-token/verification-token.module';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthEmailListener } from './auth-email.listener';
import { AuthEventProvider } from './auth-event.provider';

@Module({
  imports: [
    UserModule,
    EmailModule,
    RefreshTokenModule,
    VerificationTokenModule,
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
    RmqPublisherModule.register([{ name: RMQ_PUBLISHERS.SEED, queue: RMQ_QUEUES.SEED }]),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthEmailListener, AuthEventProvider, JwtRefreshStrategy],
})
export class AuthModule {}
