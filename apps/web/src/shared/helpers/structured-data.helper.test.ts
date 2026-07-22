import { describe, expect, it } from 'vitest';

import {
  buildFaqPageJsonLd,
  buildWebApplicationJsonLd,
  serializeJsonLd,
} from './structured-data.helper';

describe('serializeJsonLd', () => {
  it('escapes < so the payload can never close the script element', () => {
    const serialized = serializeJsonLd({ name: '</script><b>x' });

    expect(serialized).not.toContain('<');
    expect(serialized).toContain('\\u003C/script');
  });
});

describe('buildWebApplicationJsonLd', () => {
  const jsonLd = buildWebApplicationJsonLd(
    'https://twinzy.example/',
    'Twinzy',
    'A playful style game.',
    '1.00',
    'USD',
  );

  it('describes the app with its offer and normalized URL', () => {
    expect(jsonLd['@type']).toBe('WebApplication');
    expect(jsonLd['url']).toBe('https://twinzy.example/');
    expect(jsonLd['applicationCategory']).toBe('EntertainmentApplication');
    expect(jsonLd['offers']).toStrictEqual({
      '@type': 'Offer',
      price: '1.00',
      priceCurrency: 'USD',
    });
  });
});

describe('buildFaqPageJsonLd', () => {
  it('maps question/answer pairs into the FAQPage shape in order', () => {
    const jsonLd = buildFaqPageJsonLd([
      ['Is it face recognition?', 'No.'],
      ['Is my photo stored?', 'Never.'],
    ]);

    expect(jsonLd['@type']).toBe('FAQPage');
    expect(jsonLd['mainEntity']).toStrictEqual([
      {
        '@type': 'Question',
        name: 'Is it face recognition?',
        acceptedAnswer: { '@type': 'Answer', text: 'No.' },
      },
      {
        '@type': 'Question',
        name: 'Is my photo stored?',
        acceptedAnswer: { '@type': 'Answer', text: 'Never.' },
      },
    ]);
  });
});
