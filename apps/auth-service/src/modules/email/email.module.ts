import { Module } from '@nestjs/common';

import { BrevoService } from './brevo.service';
import { EmailService } from './email.service';

@Module({
  providers: [BrevoService, EmailService],
  exports: [EmailService],
})
export class EmailModule {}
