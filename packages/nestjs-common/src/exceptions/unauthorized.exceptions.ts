import { UnauthorizedException } from '@nestjs/common';

// Used when: Token not found or malformed
export class InvalidSessionException extends UnauthorizedException {
  constructor(internalDetails?: string) {
    super(
      { statusCode: 401, message: 'Access Denied', error: 'INVALID_SESSION' },
      { cause: internalDetails || 'Access Denied' },
    );
    this.name = 'InvalidSessionException';
  }
}

// Used when: request without x-bff-secret header is received
export class BffAuthenticationException extends UnauthorizedException {
  constructor(internalDetails?: string) {
    super(
      { statusCode: 401, message: 'Unauthorized', error: 'UNAUTHORIZED' },
      { cause: internalDetails || 'Unauthorized' },
    );
    this.name = 'BffAuthenticationException';
  }
}

// Used when: request without x-internal-secret header is received
export class InternalAuthenticationException extends UnauthorizedException {
  constructor(internalDetails?: string) {
    super(
      { statusCode: 401, message: 'Unauthorized', error: 'UNAUTHORIZED' },
      { cause: internalDetails || 'Unauthorized' },
    );
    this.name = 'InternalAuthenticationException';
  }
}
