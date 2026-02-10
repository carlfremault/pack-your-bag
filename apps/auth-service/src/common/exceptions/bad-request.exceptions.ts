import { BadRequestException } from '@nestjs/common';

// Used when: Verification tokens (password reset, email verification, etc.) are invalid/expired
export class InvalidTokenException extends BadRequestException {
  constructor(internalDetails?: string) {
    super(
      { message: 'Invalid or expired token', error: 'INVALID_TOKEN' },
      { cause: internalDetails || 'Invalid or expired token' },
    );
    this.name = 'InvalidTokenException';
  }
}
