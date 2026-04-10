import { ForbiddenException } from '@nestjs/common';

// Used when: User tries to login with an unverified email
export class EmailNotVerifiedException extends ForbiddenException {
  constructor() {
    super({ message: 'Email not verified', error: 'EMAIL_NOT_VERIFIED' });
    this.name = 'EmailNotVerifiedException';
  }
}
