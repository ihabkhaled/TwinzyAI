import { Injectable } from '@nestjs/common';

import type { ContactRequest, ContactResponse } from '@twinzy/shared';

import { SmtpMailAdapter } from '../adapters/smtp-mail.adapter';
import { CONTACT_SUCCESS_RESPONSE } from '../model/contact.constants';

@Injectable()
export class SendContactUseCase {
  public constructor(private readonly mailAdapter: SmtpMailAdapter) {}

  public async execute(input: ContactRequest): Promise<ContactResponse> {
    await this.mailAdapter.send(input);
    return CONTACT_SUCCESS_RESPONSE;
  }
}
