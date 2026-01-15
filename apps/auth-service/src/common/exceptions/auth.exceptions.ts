import { UnauthorizedException } from '@nestjs/common';

// Used when: Token reuse attack detected
export class TokenReusedException extends UnauthorizedException {
  constructor() {
    super({ message: 'Session expired', error: 'SESSION_EXPIRED' });
    this.name = 'TokenReusedException';
  }
}

// Used when: Manual logouts, expired tokens
export class SessionExpiredException extends UnauthorizedException {
  constructor(internalDetails?: string) {
    super(
      { message: 'Session expired', error: 'SESSION_EXPIRED' },
      { cause: internalDetails || 'Session expired' },
    );

    this.name = 'SessionExpiredException';
  }
}

// Used when: Token not found or malformed
export class InvalidSessionException extends UnauthorizedException {
  constructor(internalDetails?: string) {
    super(
      { message: 'Access Denied', error: 'INVALID_SESSION' },
      { cause: internalDetails || 'Access Denied' },
    );
    this.name = 'InvalidSessionException';
  }
}
