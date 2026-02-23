import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';

import { AuditEventType, AuditSeverity, Prisma } from '@repo/db';

import { safeCaptureSentryException } from '@/common/utils/captureSentryException';

import { AuditLogProvider } from '../audit-log/audit-log.provider';

interface EmailErrorContext {
  userId: string;
  emailType: string;
  metadata?: Prisma.InputJsonValue;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly maxRetries: number;
  private readonly retryDelayMs: number;

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
    private readonly auditLogProvider: AuditLogProvider,
  ) {
    this.maxRetries = this.configService.getOrThrow<number>('AUTH_MAIL_MAX_RETRIES');
    this.retryDelayMs = this.configService.getOrThrow<number>('AUTH_MAIL_RETRY_DELAY_MS');
  }

  async sendEmailWithRetry(
    mailOptions: {
      to: string;
      subject: string;
      text: string;
      html: string;
    },
    errorContext: EmailErrorContext,
  ): Promise<void> {
    let lastError: unknown;
    let actualAttempts = 0;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      actualAttempts = attempt;
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

        if (this.isFatalEmailError(error)) {
          this.logger.warn(
            `Fatal email error detected for ${errorContext.emailType}, aborting retries: ${errorMessage}`,
          );
          break;
        }
        this.logger.warn(
          `Failed to send ${errorContext.emailType} email (attempt ${attempt}/${this.maxRetries}): ${errorMessage}`,
        );

        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelayMs * Math.pow(2, attempt - 1));
        }
      }
    }

    this.processError(lastError, errorContext, actualAttempts);
  }

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  private isFatalEmailError(error: unknown): boolean {
    const err = error as {
      responseCode?: number;
      message?: string;
    };

    if (err.responseCode && err.responseCode >= 500 && err.responseCode < 600) {
      return true;
    }

    const message = (err.message || '').toLowerCase();
    const permanentFailures = [
      'invalid address',
      'user unknown',
      'mailbox unavailable',
      'recipient rejected',
      'does not exist',
    ];

    return permanentFailures.some((pattern) => message.includes(pattern));
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private processError(error: unknown, errorContext: EmailErrorContext, attempts: number): void {
    const { userId, emailType, metadata } = errorContext;
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    const auditMessage = `Failed to send ${errorContext.emailType} email after ${attempts} attempts: ${errorMessage}`;

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
        attempts,
        ...(metadata && typeof metadata === 'object' ? metadata : {}),
      },
      userId,
    });
  }
}
