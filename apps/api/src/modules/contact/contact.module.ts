import { Module } from '@nestjs/common';

import { SmtpMailAdapter } from './adapters/smtp-mail.adapter';
import { ContactController } from './api/contact.controller';
import { SendContactUseCase } from './application/send-contact.use-case';

@Module({
  controllers: [ContactController],
  providers: [SmtpMailAdapter, SendContactUseCase],
})
export class ContactModule {}
