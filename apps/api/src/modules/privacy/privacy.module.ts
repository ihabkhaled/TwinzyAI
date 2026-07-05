import { Module } from '@nestjs/common';

import { LogRedactionService } from './services/log-redaction.service';

/**
 * Privacy module: log redaction and the no-persistence guarantee.
 * Twinzy stores no user data by design — there is deliberately no
 * repository anywhere in this API.
 */
@Module({
  providers: [LogRedactionService],
  exports: [LogRedactionService],
})
export class PrivacyModule {}
