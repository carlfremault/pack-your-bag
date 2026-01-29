import { ForbiddenException } from '@nestjs/common';

import { MS_PER_DAY } from '@/common/constants/auth.constants';

export class DeletedUserHelper {
  static checkDeletedUser(
    user: { isDeleted: boolean; deletedAt: Date | null },
    retentionDays: number,
  ): void {
    if (!user.isDeleted) {
      return;
    }

    if (!user.deletedAt) {
      throw new ForbiddenException('Account is in an invalid state. Please contact support.');
    }

    const deletedAtDate =
      user.deletedAt instanceof Date ? user.deletedAt : new Date(user.deletedAt);
    const deletionDate = new Date(deletedAtDate.getTime() + retentionDays * MS_PER_DAY);
    const daysRemaining = Math.max(
      0,
      Math.ceil((deletionDate.getTime() - Date.now()) / MS_PER_DAY),
    );

    if (daysRemaining === 0) {
      throw new ForbiddenException(
        'Your account deletion is being processed. ' +
          'If you believe this is an error, please contact support immediately.',
      );
    }

    throw new ForbiddenException(
      `Your account is scheduled for deletion in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}. ` +
        'To cancel and restore your account, click the link in the deletion confirmation email ' +
        'or contact support.',
    );
  }
}
