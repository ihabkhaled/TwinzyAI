import { describe, expect, it } from 'vitest';

import { z } from '@/packages/zod';

import { parseSchema, safeParseSchema, SchemaParseError } from './parse-schema';

const schema = z.object({ name: z.string(), age: z.number() });

describe('parseSchema', () => {
  it('returns parsed data for valid input', () => {
    expect(parseSchema(schema, { name: 'Ada', age: 30 }, 'person')).toStrictEqual({
      name: 'Ada',
      age: 30,
    });
  });

  it('throws a SchemaParseError (also an Error) for invalid input', () => {
    expect.assertions(3);

    try {
      parseSchema(schema, { name: 123, age: 'x' }, 'person');
    } catch (error) {
      expect(error).toBeInstanceOf(SchemaParseError);
      expect(error).toBeInstanceOf(Error);

      if (error instanceof SchemaParseError) {
        expect(error.issues.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('safeParseSchema', () => {
  it('returns a success result for valid input', () => {
    expect(safeParseSchema(schema, { name: 'Ada', age: 30 })).toStrictEqual({
      success: true,
      data: { name: 'Ada', age: 30 },
    });
  });

  it('returns a failure result with string issue messages for invalid input', () => {
    const result = safeParseSchema(schema, {});

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.issues.every((issue) => typeof issue.message === 'string')).toBe(true);
    }
  });

  it('joins nested issue paths with dots', () => {
    const nested = z.object({ user: z.object({ email: z.string() }) });
    const result = safeParseSchema(nested, { user: { email: 42 } });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.issues[0]?.path).toBe('user.email');
    }
  });
});
