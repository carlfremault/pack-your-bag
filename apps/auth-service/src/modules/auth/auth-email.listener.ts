import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { MailerService } from '@nestjs-modules/mailer';

import { AUTH_EVENTS } from '@/common/constants/auth.constants';
import { safeCaptureSentryException } from '@/common/utils/captureSentryException';
import { AuditEventType, AuditSeverity, Prisma } from '@/generated/prisma';

import { AuditLogProvider } from '../audit-log/audit-log.provider';

import type {
  PasswordResetConfirmedEvent,
  PasswordResetRequestedEvent,
} from './auth-event.provider';

interface EmailErrorContext {
  userId: string;
  emailType: string;
  metadata?: Prisma.InputJsonValue;
}

@Injectable()
export class AuthEmailListener {
  private readonly logger = new Logger(AuthEmailListener.name);
  private readonly frontendUrl: string;
  private readonly maxRetries: number;
  private readonly retryDelayMs: number;

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
    private readonly auditLogProvider: AuditLogProvider,
  ) {
    this.frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
    this.maxRetries = this.configService.getOrThrow<number>('AUTH_MAIL_MAX_RETRIES');
    this.retryDelayMs = this.configService.getOrThrow<number>('AUTH_MAIL_RETRY_DELAY_MS');
  }

  @OnEvent(AUTH_EVENTS.PASSWORD_RESET_REQUESTED, { async: true })
  async handlePasswordResetRequested(event: PasswordResetRequestedEvent): Promise<void> {
    const { userId, email, resetToken } = event;
    const resetLink = `${this.frontendUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;

    await this.sendEmailWithRetry(
      {
        to: email,
        subject: 'Password Reset Request',
        text: `Reset your password here: ${resetLink}`,
        html: `<p>Click here to reset your password: <a href="${resetLink}">Reset Password</a></p>`,
      },
      {
        userId,
        emailType: 'PASSWORD_RESET_REQUEST',
        metadata: { resetToken: resetToken.substring(0, 8) + '...' },
      },
    );
  }

  @OnEvent(AUTH_EVENTS.PASSWORD_RESET_CONFIRMED, { async: true })
  async handlePasswordResetConfirmed(event: PasswordResetConfirmedEvent): Promise<void> {
    const { userId, email, resetTimestamp } = event;

    await this.sendEmailWithRetry(
      {
        to: email,
        subject: 'Password Reset Confirmation',
        text: `Your password was successfully reset on ${resetTimestamp.toLocaleString()}. If you did not make this change, please contact support immediately.`,
        html: `
          <p>Your password was successfully reset on ${resetTimestamp.toLocaleString()}.</p>
          <p><strong>If you did not make this change, please contact support immediately.</strong></p>
        `,
      },
      {
        userId,
        emailType: 'PASSWORD_RESET_CONFIRMATION',
      },
    );
  }

  private async sendEmailWithRetry(
    mailOptions: {
      to: string;
      subject: string;
      text: string;
      html: string;
    },
    errorContext: EmailErrorContext,
  ): Promise<void> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        await this.mailerService.sendMail(mailOptions);

        if (attempt > 1) {
          this.logger.log(
            `Successfully sent ${errorContext.emailType} email to user ${errorContext.userId} on attempt ${attempt}`,
          );
        }
        return;
      } catch (error) {
        lastError = error;
        const errorMessage = error instanceof Error ? error.message : String(error);

        if (errorMessage.includes('Invalid addresses') || errorMessage.includes('550')) {
          this.logger.warn(
            `Fatal email error detected for ${errorContext.emailType}, aborting retries: ${errorMessage}`,
          );
          break;
        }
        this.logger.warn(
          `Failed to send ${errorContext.emailType} email (attempt ${attempt}/${this.maxRetries}): ${errorMessage}`,
        );

        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelayMs * attempt);
        }
      }
    }

    this.processError(lastError, errorContext);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private processError(error: unknown, errorContext: EmailErrorContext): void {
    const { userId, emailType, metadata } = errorContext;
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    const auditMessage = `Failed to send ${errorContext.emailType} email after ${this.maxRetries} attempts: ${errorMessage}`;

    this.logger.error(auditMessage, errorStack);

    safeCaptureSentryException(
      {
        exception: error,
        request: null,
        errorCode: AuditEventType.EMAIL_SEND_FAILED,
        eventType: AuditEventType.EMAIL_SEND_FAILED,
        level: 'error',
        fingerprint: [emailType, 'EMAIL_SEND_FAILED'],
      },
      this.logger,
    );

    this.auditLogProvider.auditRequest({
      eventType: AuditEventType.EMAIL_SEND_FAILED,
      severity: AuditSeverity.ERROR,
      statusCode: null,
      errorCode: AuditEventType.EMAIL_SEND_FAILED,
      message: auditMessage,
      metadata: {
        errorMessage,
        emailType: emailType,
        attempts: this.maxRetries,
        ...(metadata && typeof metadata === 'object' ? metadata : {}),
      },
      userId,
    });
  }
}
