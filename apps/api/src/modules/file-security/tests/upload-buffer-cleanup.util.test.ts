import { describe, expect, it } from 'vitest';

import { buildUploadFile } from '../../../tests/fixtures/image-fixtures';
import { wipeUploadedImageBuffer } from '../lib/upload-buffer-cleanup.util';

describe('wipeUploadedImageBuffer', () => {
  it('zero-fills a populated upload exactly once', () => {
    const file = buildUploadFile();

    expect(wipeUploadedImageBuffer(file)).toBe(true);
    expect(file.buffer.every((byte) => byte === 0)).toBe(true);
  });

  it('does nothing when no upload exists', () => {
    expect(wipeUploadedImageBuffer(undefined)).toBe(false);
  });
});
