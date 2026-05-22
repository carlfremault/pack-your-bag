import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { BrevoClient, BrevoError, BrevoTimeoutError } from '@getbrevo/brevo';

interface SendTemplateOptions {
  templateId: number;
  to: string;
  params: Record<string, unknown>;
}

@Injectable()
export class BrevoService {
  private readonly logger = new Logger(BrevoService.name);
  private readonly client: BrevoClient | null;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('BREVO_API_KEY');

    if (apiKey) {
      this.client = new BrevoClient({ apiKey });
      this.logger.log('Brevo API client initialized');
    } else {
      this.client = null;
      this.logger.log('Brevo API key not configured — template emails disabled');
    }
  }

  get isEnabled(): boolean {
    return this.client !== null;
  }

  async sendTemplate({ templateId, to, params }: SendTemplateOptions): Promise<void> {
    if (!this.client) {
      throw new Error('Brevo client is not configured');
    }

    await this.client.transactionalEmails.sendTransacEmail({
      templateId,
      to: [{ email: to }],
      params,
    });
  }

  isFatalBrevoError(error: unknown): boolean {
    if (error instanceof BrevoTimeoutError) {
      return false;
    }

    if (error instanceof BrevoError) {
      const message = error.message.toLowerCase();
      const permanentFailures = [
        'invalid address',
        'user unknown',
        'mailbox unavailable',
        'recipient rejected',
        'does not exist',
        'unauthorized',
        'template not found',
        'invalid parameter',
      ];

      return permanentFailures.some((pattern) => message.includes(pattern));
    }

    return false;
  }
}
