import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';

import { AUTH_EVENTS } from '@/common/constants/auth.constants';

import { EmailService } from '../email/email.service';

import type { AccountDeletionRequestedEvent } from './user-event.provider';

@Injectable()
export class UserEmailListener {
  private readonly frontendUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {
    this.frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
  }

  @OnEvent(AUTH_EVENTS.ACCOUNT_DELETION_REQUESTED, { async: true })
  async handleAccountDeletionRequested(event: AccountDeletionRequestedEvent): Promise<void> {
    const { userId, email, cancellationToken, cancellationDate } = event;
    const cancellationLink = `${this.frontendUrl}/cancel-deletion?token=${encodeURIComponent(cancellationToken)}`;
    const errorContext = { userId, emailType: 'ACCOUNT_DELETION_REQUEST' };

    if (this.emailService.isBrevoEnabled) {
      const templateId = this.configService.getOrThrow<number>(
        'BREVO_TEMPLATE_ACCOUNT_DELETION_REQUEST',
      );
      await this.emailService.sendTemplateWithRetry(
        { templateId, to: email, params: { cancellationLink, cancellationDate } },
        errorContext,
      );
      return;
    }

    await this.emailService.sendEmailWithRetry(
      {
        to: email,
        subject: 'Account Deletion Request',
        text: `Your account deletion has been scheduled for ${cancellationDate}. If this was a mistake you can cancel the deletion here: ${cancellationLink}. After ${cancellationDate}, your account and all data will be permanently deleted.`,
        html: `
          <p>Your account deletion has been scheduled for ${cancellationDate}.</p>
          <p><strong>If this was a mistake you can <a href="${cancellationLink}">cancel the deletion here</a>.</strong></p>
          <p>After ${cancellationDate}, your account and all data will be permanently deleted.</p>
        `,
      },
      errorContext,
    );
  }
}
