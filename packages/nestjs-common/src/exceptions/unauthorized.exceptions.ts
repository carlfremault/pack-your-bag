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
