import { describe, expect, it } from 'vitest';

import { sanitizeAiResponseText } from '../lib/ai-response-sanitizer';

describe('sanitizeAiResponseText', () => {
  it('returns plain JSON unchanged', () => {
    expect(sanitizeAiResponseText('{"a":1}')).toBe('{"a":1}');
  });

  it('strips opening and closing markdown fences', () => {
    expect(sanitizeAiResponseText('```json\n{"a":1}\n```')).toBe('{"a":1}');
  });

  it('strips language-agnostic fences', () => {
    expect(sanitizeAiResponseText('```\n{"a":1}\n```')).toBe('{"a":1}');
  });

  it('trims surrounding whitespace', () => {
    expect(sanitizeAiResponseText('  {"a":1}  \n')).toBe('{"a":1}');
  });
});
