import { describe, expect, it } from 'vitest';

import { LogRedactionService } from '../application/log-redaction.service';

describe('LogRedactionService', () => {
  const service = new LogRedactionService();

  it('delegates to the redaction helper, stripping secrets from the value', () => {
    const redacted = service.redact('token=super-secret-value');

    expect(redacted).not.toContain('super-secret-value');
    expect(redacted).toContain('[REDACTED]');
  });

  it('leaves ordinary text untouched', () => {
    expect(service.redact('a friendly log line')).toBe('a friendly log line');
  });
});
