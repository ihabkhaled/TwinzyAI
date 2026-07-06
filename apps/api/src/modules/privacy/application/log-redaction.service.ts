import { Injectable } from '@nestjs/common';

import { redactForLog } from '../lib/log-redaction.helpers';

/**
 * Injectable wrapper over the pure redaction helper so higher layers use DI
 * while adapters may import the helper directly (layer rules).
 */
@Injectable()
export class LogRedactionService {
  public redact(value: string): string {
    return redactForLog(value);
  }
}
