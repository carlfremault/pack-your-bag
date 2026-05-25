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

// Used when: A verify-email token has already been used and the email is already verified
export class EmailAlreadyVerifiedException extends BadRequestException {
  constructor() {
    super(
      { message: 'Email address has already been verified', error: 'EMAIL_ALREADY_VERIFIED' },
      { cause: 'Email address has already been verified' },
    );
    this.name = 'EmailAlreadyVerifiedException';
  }
}
