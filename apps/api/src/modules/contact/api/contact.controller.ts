import { Body, Controller, Post, UsePipes } from '@nestjs/common';

import type { ContactRequest, ContactResponse } from '@twinzy/shared';
import { ContactRequestSchema } from '@twinzy/shared';

import { ApiTags } from '../../../core/openapi';
import { Throttle } from '../../../core/rate-limit';
import { createZodValidationPipe } from '../../../core/validation';
import { SendContactUseCase } from '../application/send-contact.use-case';
import { CONTACT_THROTTLE } from '../model/contact.constants';

@ApiTags('contact')
@Controller('contact')
export class ContactController {
  public constructor(private readonly sendContactUseCase: SendContactUseCase) {}

  @Post()
  @Throttle(CONTACT_THROTTLE)
  @UsePipes(createZodValidationPipe(ContactRequestSchema))
  public send(@Body() body: ContactRequest): Promise<ContactResponse> {
    return this.sendContactUseCase.execute(body);
  }
}
