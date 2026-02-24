import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtAuthStrategy } from './strategies/jwt-auth.strategy';

/**
 * Provides JWT authentication guard and strategy for NestJS applications.
 *
 * Prerequisites — the consuming app must register these before importing this module:
 * - ConfigModule.forRoot({ isGlobal: true }) — required for ConfigService (RSA_PUBLIC_KEY_B64, AUTH_USER_DELETE_RETENTION_DAYS)
 */

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  providers: [JwtAuthStrategy, JwtAuthGuard],
  exports: [JwtAuthGuard, PassportModule],
})
export class JwtAuthModule {}
