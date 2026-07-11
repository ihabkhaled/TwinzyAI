import { describe, expect, it } from 'vitest';

import { publicEnvSchema } from '@/packages/env/public-env';

/**
 * The public PayPal client id enables the frontend payment step. Like the
 * donate handle it is a public value, but it is still charset+length bounded so
 * a malformed value can only ever be a query-param, never markup or a new host.
 */
describe('publicEnvSchema paypalClientId', () => {
  it('accepts a realistic PayPal client id', () => {
    const clientId = 'Abq11gYHpqR3_tuq0Xh_392P0BVXQKdihacG2iAwdocsomcT8XHgHiWp49OAq1KEkKh';
    expect(publicEnvSchema.parse({ paypalClientId: clientId }).paypalClientId).toBe(clientId);
  });

  it('treats unset/empty as feature-off (free UI)', () => {
    expect(publicEnvSchema.parse({}).paypalClientId).toBeUndefined();
    expect(publicEnvSchema.parse({ paypalClientId: '' }).paypalClientId).toBeUndefined();
  });

  it('rejects anything that could break out of the SDK query parameter', () => {
    for (const hostile of [
      'short',
      'has spaces',
      'a"onload=x',
      'a<script>',
      'a/b?c=d',
      'https://evil.example',
      'x'.repeat(200),
    ]) {
      expect(publicEnvSchema.safeParse({ paypalClientId: hostile }).success).toBe(false);
    }
  });
});
