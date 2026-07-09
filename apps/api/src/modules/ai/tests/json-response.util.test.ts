import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { parseAiJsonResponse } from '../lib/json-response.util';

const TestSchema = z.object({
  value: z.string(),
  count: z.number(),
});

describe('parseAiJsonResponse', () => {
  it('parses valid JSON and returns the typed data', () => {
    const result = parseAiJsonResponse('{"value":"hello","count":3}', TestSchema);
    expect(result).toEqual({ value: 'hello', count: 3 });
  });

  it('strips markdown fences before parsing', () => {
    const result = parseAiJsonResponse('```json\n{"value":"hello","count":3}\n```', TestSchema);
    expect(result).toEqual({ value: 'hello', count: 3 });
  });

  it('throws an integration error for invalid JSON', () => {
    expect(() => parseAiJsonResponse('not json', TestSchema)).toThrow(
      'The vibe engine returned something we could not read. Please try again.',
    );
  });

  it('throws an integration error for schema mismatches', () => {
    expect(() => parseAiJsonResponse('{"value":"hello"}', TestSchema)).toThrow(
      'The vibe engine returned something we could not read. Please try again.',
    );
  });

  it('reports schema issues to the optional listener', () => {
    const listener = vi.fn();
    expect(() => parseAiJsonResponse('{"value":123}', TestSchema, listener)).toThrow();
    expect(listener).toHaveBeenCalledWith(expect.stringContaining('value'));
  });

  it('reports non-JSON to the optional listener', () => {
    const listener = vi.fn();
    expect(() => parseAiJsonResponse('broken', TestSchema, listener)).toThrow();
    expect(listener).toHaveBeenCalledWith('response is not valid JSON');
  });
});
