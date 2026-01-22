import { ExecutionContext, Injectable } from '@nestjs/common';
import { TokenExpiredError } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';

import { SessionExpiredException } from '@/common/exceptions/auth.exceptions';

@Injectable()
export class JwtRefreshGuard extends AuthGuard('refresh') {
  // Function override to enable error logging through the exception filter
  handleRequest<TUser>(
    err: unknown,
    user: unknown,
    info: unknown,
    context: ExecutionContext,
    status?: unknown,
  ): TUser {
    if (info instanceof TokenExpiredError) {
      throw new SessionExpiredException('JWT token expired at strategy level');
    }

    if (err instanceof Error) {
      throw err;
    }

    return super.handleRequest(err, user, info, context, status);
  }
}
