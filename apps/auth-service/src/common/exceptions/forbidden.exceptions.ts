import { ForbiddenException } from '@nestjs/common';

export class AccountDeletedException extends ForbiddenException {
  constructor(daysRemaining: number) {
    const message =
      daysRemaining <= 0
        ? 'Your account deletion is being processed. If you believe this is an error, please contact support immediately.'
        : `Your account is scheduled for deletion in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}. ` +
          'To cancel and restore your account, click the link in the deletion confirmation email or contact support.';

    super(
      { message, error: 'ACCOUNT_DELETED' },
      { cause: `Account deleted, ${daysRemaining} days remaining` },
    );
    this.name = 'AccountDeletedException';
  }
}
