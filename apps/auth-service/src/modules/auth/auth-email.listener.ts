import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';

import { AUTH_EVENTS } from '@/common/constants/auth.constants';
import { EmailService } from '@/modules/email/email.service';

import type {
  PasswordResetConfirmedEvent,
  PasswordResetRequestedEvent,
} from './auth-event.provider';

@Injectable()
export class AuthEmailListener {
  private readonly frontendUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {
    this.frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
  }

  @OnEvent(AUTH_EVENTS.PASSWORD_RESET_REQUESTED, { async: true })
  async handlePasswordResetRequested(event: PasswordResetRequestedEvent): Promise<void> {
    const { userId, email, resetToken } = event;
    const resetLink = `${this.frontendUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;

    await this.emailService.sendEmailWithRetry(
      {
        to: email,
        subject: 'Password Reset Request',
        text: `Reset your password here: ${resetLink}`,
        html: `<p>Click here to reset your password: <a href="${resetLink}">Reset Password</a></p>`,
      },
      {
        userId,
        emailType: 'PASSWORD_RESET_REQUEST',
      },
    );
  }

  @OnEvent(AUTH_EVENTS.PASSWORD_RESET_CONFIRMED, { async: true })
  async handlePasswordResetConfirmed(event: PasswordResetConfirmedEvent): Promise<void> {
    const { userId, email, resetTimestamp } = event;

    await this.emailService.sendEmailWithRetry(
      {
        to: email,
        subject: 'Password Reset Confirmation',
        text: `Your password was successfully reset on ${resetTimestamp}. If you did not make this change, please contact support immediately.`,
        html: `
          <p>Your password was successfully reset on ${resetTimestamp}.</p>
          <p><strong>If you did not make this change, please contact support immediately.</strong></p>
        `,
      },
      {
        userId,
        emailType: 'PASSWORD_RESET_CONFIRMATION',
      },
    );
  }
}
