import { expect, test } from '@playwright/test';

import { FinalGameResultSchema, GameStreamMessageSchema } from '@twinzy/shared';

import { buildSuccessBody, SUCCESS_STREAM, toEventStream } from './helpers';

test.describe('mock payload validity', () => {
  test('buildSuccessBody validates against FinalGameResultSchema', () => {
    const body = buildSuccessBody(1);
    const parsed = FinalGameResultSchema.safeParse(body);
    expect(parsed.success).toBe(true);
  });

  test('success stream events validate against GameStreamMessageSchema', () => {
    const stream = SUCCESS_STREAM(1);
    const failures = stream
      .map((message, index) => ({ index, parsed: GameStreamMessageSchema.safeParse(message) }))
      .flatMap(({ index, parsed }) =>
        parsed.success ? [] : [{ index, issues: parsed.error.issues }],
      );

    expect(failures).toEqual([]);
  });

  test('toEventStream can be parsed back into events', () => {
    const stream = SUCCESS_STREAM(1);
    const text = toEventStream(stream);
    const frames = text.split('\n\n').filter(Boolean);
    expect(frames).toHaveLength(stream.length);
  });
});
