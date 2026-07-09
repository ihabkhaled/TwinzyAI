import { describe, expect, it } from 'vitest';

import { parseAiRouteList, parseAiRouteToken } from './ai-route.util';

describe('parseAiRouteToken', () => {
  it('parses an explicit provider:model token', () => {
    expect(parseAiRouteToken('deepseek:deepseek-v4-flash', 'TEST')).toEqual({
      provider: 'deepseek',
      model: 'deepseek-v4-flash',
    });
  });

  it('treats a bare model id as a gemini route (legacy compatibility)', () => {
    expect(parseAiRouteToken('gemini-3.5-flash', 'TEST')).toEqual({
      provider: 'gemini',
      model: 'gemini-3.5-flash',
    });
  });

  it('keeps colons inside the model id after the first separator', () => {
    expect(parseAiRouteToken('openai:ft:gpt-x:org', 'TEST')).toEqual({
      provider: 'openai',
      model: 'ft:gpt-x:org',
    });
  });

  it('rejects an unknown provider with the offending env key in the message', () => {
    expect(() => parseAiRouteToken('grok:model-1', 'AI_ROUTE_JUDGE')).toThrow(
      'Invalid AI route in AI_ROUTE_JUDGE: unknown provider "grok"',
    );
  });

  it('rejects an empty model', () => {
    expect(() => parseAiRouteToken('openai:', 'TEST')).toThrow(/empty model/);
  });
});

describe('parseAiRouteList', () => {
  it('parses a mixed comma-separated chain, trimming whitespace', () => {
    expect(parseAiRouteList(' gemini-3.5-flash , qwen:qwen3-vl-plus ', 'TEST')).toEqual([
      { provider: 'gemini', model: 'gemini-3.5-flash' },
      { provider: 'qwen', model: 'qwen3-vl-plus' },
    ]);
  });

  it('returns an empty list for an empty value', () => {
    expect(parseAiRouteList('', 'TEST')).toEqual([]);
    expect(parseAiRouteList(' , ,', 'TEST')).toEqual([]);
  });
});
