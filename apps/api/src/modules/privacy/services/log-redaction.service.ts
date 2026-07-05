import { Injectable } from '@nestjs/common';

import { redactForLog } from '../utils/log-redaction.util';

/**
 * Injectable wrapper over the pure redaction util so higher layers use DI
 * while adapters may import the util directly (layer rules).
 */
@Injectable()
export class LogRedactionService {
  public redact(value: string): string {
    return redactForLog(value);
  }
}
