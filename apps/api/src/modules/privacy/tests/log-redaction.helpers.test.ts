import { describe, expect, it } from 'vitest';

import { redactForLog } from '../lib/log-redaction.helpers';
import { MAX_LOGGED_LENGTH } from '../model/privacy.constants';

const REDACTED = '[REDACTED]';

describe('redactForLog', () => {
  it('strips long base64 image runs — the signature of leaked image bytes', () => {
    const imageBytes = 'A'.repeat(120);
    const input = `upload data:image/png;base64,${imageBytes}`;

    const result = redactForLog(input);

    expect(result).toContain(REDACTED);
    expect(result).not.toContain(imageBytes);
  });

  it('redacts authorization header values', () => {
    const result = redactForLog('authorization: Bearer_supersecrettoken');

    expect(result).toContain(REDACTED);
    expect(result).not.toContain('supersecrettoken');
  });

  it('redacts token=... secrets', () => {
    const result = redactForLog('token=abc123def456');

    expect(result).toBe(`token=${REDACTED}`);
    expect(result).not.toContain('abc123def456');
  });

  it('redacts key-style secret values (e.g. apiKey=...)', () => {
    const result = redactForLog('apiKey=supersecretvalue');

    expect(result).toContain(REDACTED);
    expect(result).not.toContain('supersecretvalue');
  });

  it('caps output at the maximum logged length', () => {
    const oversized = 'word '.repeat(400); // 2000 chars, no 64-char base64 run

    const result = redactForLog(oversized);

    expect(result).toHaveLength(MAX_LOGGED_LENGTH);
    expect(result.length).toBeLessThan(oversized.length);
  });

  it('leaves plain, safe text untouched', () => {
    const input = 'hello world this is a perfectly safe log line';

    expect(redactForLog(input)).toBe(input);
  });
});
