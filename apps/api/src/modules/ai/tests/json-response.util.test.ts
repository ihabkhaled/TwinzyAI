import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { buildSchemaValidator, parseAiJsonResponse } from '../lib/json-response.util';

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

  it('recovers JSON wrapped in leading/trailing prose via the object extractor', () => {
    const result = parseAiJsonResponse(
      'Sure! Here is the result: {"value":"hi","count":1} — hope that helps.',
      TestSchema,
    );
    expect(result).toEqual({ value: 'hi', count: 1 });
  });

  it('applies the optional normalize step before validation', () => {
    const normalize = vi.fn((parsed: unknown) => ({
      ...(parsed as Record<string, unknown>),
      count: Number((parsed as { count: string }).count),
    }));
    const result = parseAiJsonResponse(
      '{"value":"hi","count":"7"}',
      TestSchema,
      undefined,
      normalize,
    );
    expect(normalize).toHaveBeenCalledOnce();
    expect(result).toEqual({ value: 'hi', count: 7 });
  });
});

describe('buildSchemaValidator', () => {
  const isValid = buildSchemaValidator(TestSchema);

  it('accepts text that parses and satisfies the schema', () => {
    expect(isValid('{"value":"hi","count":2}')).toBe(true);
  });

  it('accepts schema-valid text even inside markdown fences', () => {
    expect(isValid('```json\n{"value":"hi","count":2}\n```')).toBe(true);
  });

  it('rejects valid JSON that does not satisfy the schema', () => {
    expect(isValid('{"value":"hi"}')).toBe(false);
  });

  it('rejects text that is not JSON at all', () => {
    expect(isValid('definitely not json')).toBe(false);
  });
});
