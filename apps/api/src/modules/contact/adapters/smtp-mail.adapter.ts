import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import nodemailer from 'nodemailer';

import type { ContactRequest } from '@twinzy/shared';

import { AppConfigService } from '../../../config';

@Injectable()
export class SmtpMailAdapter {
  public constructor(private readonly config: AppConfigService) {}

  public async send(input: ContactRequest): Promise<void> {
    const mail = this.config.contactEmailConfig;
    if (!mail.enabled) {
      throw new ServiceUnavailableException('Contact email is unavailable');
    }

    const transport = nodemailer.createTransport({
      host: mail.host,
      port: mail.port,
      secure: mail.secure,
      auth: { user: mail.user, pass: mail.pass },
      disableFileAccess: true,
      disableUrlAccess: true,
    });

    await transport.sendMail({
      from: mail.from,
      to: mail.to,
      replyTo: input.email,
      subject: `[Twinzy contact] ${input.subject}`,
      text: `From: ${input.email}\n\n${input.message}`,
    });
  }
}
