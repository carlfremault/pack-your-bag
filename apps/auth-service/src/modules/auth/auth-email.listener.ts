import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';

import { AUTH_EVENTS } from '@/common/constants/auth.constants';
import { EmailService } from '@/modules/email/email.service';

import type {
  AccountVerificationRequestedEvent,
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
    const errorContext = { userId, emailType: 'PASSWORD_RESET_REQUEST' };

    if (this.emailService.isBrevoEnabled) {
      const templateId = this.configService.getOrThrow<number>(
        'BREVO_TEMPLATE_PASSWORD_RESET_REQUEST',
      );
      await this.emailService.sendTemplateWithRetry(
        { templateId, to: email, params: { resetLink } },
        errorContext,
      );
      return;
    }

    await this.emailService.sendEmailWithRetry(
      {
        to: email,
        subject: 'Password Reset Request',
        text: `Reset your password here: ${resetLink}`,
        html: `<p>Click here to reset your password: <a href="${resetLink}">Reset Password</a></p>`,
      },
      errorContext,
    );
  }

  @OnEvent(AUTH_EVENTS.PASSWORD_RESET_CONFIRMED, { async: true })
  async handlePasswordResetConfirmed(event: PasswordResetConfirmedEvent): Promise<void> {
    const { userId, email, resetTimestamp } = event;
    const errorContext = { userId, emailType: 'PASSWORD_RESET_CONFIRMATION' };

    if (this.emailService.isBrevoEnabled) {
      const templateId = this.configService.getOrThrow<number>(
        'BREVO_TEMPLATE_PASSWORD_RESET_CONFIRMATION',
      );
      await this.emailService.sendTemplateWithRetry(
        { templateId, to: email, params: { resetTimestamp } },
        errorContext,
      );
      return;
    }

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
      errorContext,
    );
  }

  @OnEvent(AUTH_EVENTS.ACCOUNT_VERIFICATION_REQUESTED, { async: true })
  async handleAccountVerificationRequested(
    event: AccountVerificationRequestedEvent,
  ): Promise<void> {
    const { userId, email, verificationToken } = event;
    const verificationLink = `${this.frontendUrl}/verify-email?token=${encodeURIComponent(verificationToken)}`;
    const errorContext = { userId, emailType: 'ACCOUNT_VERIFICATION_REQUEST' };

    if (this.emailService.isBrevoEnabled) {
      const templateId = this.configService.getOrThrow<number>(
        'BREVO_TEMPLATE_ACCOUNT_VERIFICATION_REQUEST',
      );
      await this.emailService.sendTemplateWithRetry(
        { templateId, to: email, params: { verificationLink } },
        errorContext,
      );
      return;
    }

    await this.emailService.sendEmailWithRetry(
      {
        to: email,
        subject: 'Account Verification Request',
        text: `Complete your registration here: ${verificationLink}`,
        html: `<p>Click here to confirm your email address and complete your registration: <a href="${verificationLink}">Confirm Email</a></p>`,
      },
      errorContext,
    );
  }
}
