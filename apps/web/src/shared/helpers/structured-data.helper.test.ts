import { describe, expect, it } from 'vitest';

import {
  buildBreadcrumbListJsonLd,
  buildFaqPageJsonLd,
  buildWebApplicationJsonLd,
  serializeJsonLd,
} from './structured-data.helper';

describe('serializeJsonLd', () => {
  it('escapes < so the payload can never close the script element', () => {
    const serialized = serializeJsonLd({ name: '</script><b>x' });

    expect(serialized).not.toContain('<');
    expect(serialized).toContain(String.raw`\u003C/script`);
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

describe('buildBreadcrumbListJsonLd', () => {
  it('numbers each crumb in order and resolves absolute URLs', () => {
    const jsonLd = buildBreadcrumbListJsonLd('https://twinzy.example/', [
      ['Home', '/'],
      ['Guides', '/guides'],
      ['Choosing your best photo', '/guides/best-photo'],
    ]);

    expect(jsonLd['@type']).toBe('BreadcrumbList');
    expect(jsonLd['itemListElement']).toStrictEqual([
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://twinzy.example/' },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Guides',
        item: 'https://twinzy.example/guides',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'Choosing your best photo',
        item: 'https://twinzy.example/guides/best-photo',
      },
    ]);
  });
});
