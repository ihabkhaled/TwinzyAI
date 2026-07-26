import { describe, expect, it } from 'vitest';

import { ContactRequestSchema } from './contact.schemas';

describe('ContactRequestSchema', () => {
  it('accepts a bounded valid request and trims text', () => {
    expect(
      ContactRequestSchema.parse({
        email: 'sender@example.com',
        subject: '  Subject  ',
        message: '  A useful message  ',
      }),
    ).toMatchObject({ subject: 'Subject', message: 'A useful message' });
  });

  it('rejects unknown keys, malformed email, and short content', () => {
    expect(
      ContactRequestSchema.safeParse({
        email: 'invalid',
        subject: 'x',
        message: 'short',
        recipient: 'attacker@example.com',
      }).success,
    ).toBe(false);
  });
});
