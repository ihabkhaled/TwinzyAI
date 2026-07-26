import { describe, expect, it } from 'vitest';

import { createXmlResponse, escapeXml } from './xml-response.helper';

describe('XML response helpers', () => {
  it('escapes all XML metacharacters', () => {
    expect(escapeXml(`<tag a="1">'&`)).toBe('&lt;tag a=&quot;1&quot;&gt;&apos;&amp;');
  });

  it('returns cacheable nosniff XML', async () => {
    const response = createXmlResponse('<rss/>');
    expect(response.headers.get('content-type')).toBe('application/xml; charset=utf-8');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(response.headers.get('cache-control')).toContain('s-maxage=3600');
    await expect(response.text()).resolves.toBe('<rss/>');
  });
});
