import { describe, expect, it } from 'vitest';

import {
  buildGuidePath,
  GUIDE_NAMESPACE_BY_SLUG,
  GUIDE_SLUGS,
  HOME_FEATURED_GUIDE_SLUGS,
  isGuideSlug,
  RELATED_GUIDE_SLUGS,
} from './guides.constants';

describe('guides catalog', () => {
  it('gives every guide a namespace entry', () => {
    for (const slug of GUIDE_SLUGS) {
      expect(GUIDE_NAMESPACE_BY_SLUG[slug]).toBeTruthy();
    }
  });

  it('never lets a guide relate to itself', () => {
    for (const slug of GUIDE_SLUGS) {
      expect(RELATED_GUIDE_SLUGS[slug]).not.toContain(slug);
    }
  });

  it('only relates guides that exist in the catalog', () => {
    for (const slug of GUIDE_SLUGS) {
      const related = RELATED_GUIDE_SLUGS[slug];
      for (const relatedSlug of related) {
        expect(GUIDE_SLUGS).toContain(relatedSlug);
      }
    }
  });

  it('only features guides that exist in the catalog', () => {
    for (const slug of HOME_FEATURED_GUIDE_SLUGS) {
      expect(GUIDE_SLUGS).toContain(slug);
    }
  });

  it('builds the detail route from a slug', () => {
    expect(buildGuidePath('best-photo')).toBe('/guides/best-photo');
  });

  it('recognizes only real catalog slugs', () => {
    expect(isGuideSlug('best-photo')).toBe(true);
    expect(isGuideSlug('not-a-real-guide')).toBe(false);
  });
});
