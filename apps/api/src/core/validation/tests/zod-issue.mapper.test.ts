import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { flattenZodIssues } from '../zod-issue.mapper';

const NestedSchema = z.strictObject({
  title: z.string(),
  meta: z.strictObject({
    slug: z.string().min(3),
    tags: z.array(z.string()),
  }),
});

describe('flattenZodIssues', () => {
  it('flattens top-level and nested issues into dot-joined field paths', () => {
    const result = NestedSchema.safeParse({
      title: 42,
      meta: { slug: 'x', tags: ['ok', 7] },
    });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    const issues = flattenZodIssues(result.error);
    const fields = issues.map((issue) => issue.field);

    expect(fields).toContain('title');
    expect(fields).toContain('meta.slug');
    expect(fields).toContain('meta.tags.1');
    for (const issue of issues) {
      expect(issue.constraint.length).toBeGreaterThan(0);
    }
  });

  it('labels root-level issues with the root field name', () => {
    const result = z.string().safeParse(123);

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    const issues = flattenZodIssues(result.error);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.field).toBe('(root)');
    expect(issues[0]?.constraint).toBeTypeOf('string');
  });
});
