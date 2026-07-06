import { describe, expect, it } from 'vitest';

import {
  buildJpegBuffer,
  buildPngBuffer,
  buildWebpBuffer,
} from '../../../tests/fixtures/image-fixtures';
import { readImageDimensions } from '../lib/image-dimensions.helpers';

/**
 * Header-only dimension parsing. Every branch is exercised with hand-crafted
 * minimal buffers so each format path (JPEG SOF / PNG IHDR / WebP VP8*),
 * every reject path, and the unsupported-type fallback are covered directly.
 */

/** Pads a byte array with trailing zeros so the parser's length guards pass. */
const toBuffer = (bytes: number[], minLength = 0): Buffer => {
  const padded = [...bytes];
  while (padded.length < minLength) {
    padded.push(0);
  }
  return Buffer.from(padded);
};

describe('readImageDimensions — JPEG', () => {
  it('reads dimensions from an immediate SOF0 marker', () => {
    expect(readImageDimensions(buildJpegBuffer(640, 480), 'image/jpeg')).toEqual({
      width: 640,
      height: 480,
    });
  });

  it('reads dimensions from a progressive SOF2 marker', () => {
    const sof2 = toBuffer(
      [
        0xff, 0xd8, 0xff, 0xc2, 0x00, 0x11, 0x08, 0x02, 0x58, 0x03, 0x20, 0x03, 0x01, 0x22, 0x00,
        0x02, 0x11, 0x01, 0x03, 0x11, 0x01, 0xff, 0xd9,
      ],
      24,
    );

    expect(readImageDimensions(sof2, 'image/jpeg')).toEqual({ width: 800, height: 600 });
  });

  it('skips a leading APP0 segment before the SOF marker', () => {
    const multiSegment = toBuffer(
      [
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x04, 0xaa, 0xbb, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x01, 0x90,
        0x02, 0x80,
      ],
      24,
    );

    expect(readImageDimensions(multiSegment, 'image/jpeg')).toEqual({ width: 640, height: 400 });
  });

  it('returns undefined when a segment does not start with 0xff', () => {
    expect(
      readImageDimensions(toBuffer([0xff, 0xd8, 0x00, 0x00], 14), 'image/jpeg'),
    ).toBeUndefined();
  });

  it('returns undefined when a segment length is below 2', () => {
    expect(
      readImageDimensions(toBuffer([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x01], 14), 'image/jpeg'),
    ).toBeUndefined();
  });

  it('returns undefined when the scan walks off the end without an SOF', () => {
    expect(
      readImageDimensions(toBuffer([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x06], 12), 'image/jpeg'),
    ).toBeUndefined();
  });
});

describe('readImageDimensions — PNG', () => {
  it('reads dimensions from the IHDR chunk', () => {
    expect(readImageDimensions(buildPngBuffer(320, 240), 'image/png')).toEqual({
      width: 320,
      height: 240,
    });
  });

  it('returns undefined for a buffer too short to hold IHDR', () => {
    expect(readImageDimensions(Buffer.from([0x89, 0x50, 0x4e, 0x47]), 'image/png')).toBeUndefined();
  });

  it('returns undefined when the first chunk type is not IHDR', () => {
    const notIhdr = toBuffer(
      [
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x44, 0x41,
        0x54,
      ],
      26,
    );

    expect(readImageDimensions(notIhdr, 'image/png')).toBeUndefined();
  });
});

describe('readImageDimensions — WebP', () => {
  it('reads canvas size from a VP8X extended chunk', () => {
    expect(readImageDimensions(buildWebpBuffer(640, 480), 'image/webp')).toEqual({
      width: 640,
      height: 480,
    });
  });

  it('reads dimensions from a lossy VP8 chunk with a valid sync code', () => {
    const vp8 = toBuffer(
      [
        0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38,
        0x20, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x9d, 0x01, 0x2a, 0x80, 0x02, 0xe0, 0x01,
      ],
      30,
    );

    expect(readImageDimensions(vp8, 'image/webp')).toEqual({ width: 640, height: 480 });
  });

  it('reads dimensions from a lossless VP8L chunk', () => {
    const vp8l = toBuffer(
      [
        0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38,
        0x4c, 0x00, 0x00, 0x00, 0x00, 0x2f, 0x7f, 0xc2, 0x77, 0x00,
      ],
      30,
    );

    expect(readImageDimensions(vp8l, 'image/webp')).toEqual({ width: 640, height: 480 });
  });

  it('returns undefined for a buffer shorter than the WebP header', () => {
    expect(
      readImageDimensions(toBuffer([0x52, 0x49, 0x46, 0x46], 20), 'image/webp'),
    ).toBeUndefined();
  });

  it('returns undefined for a lossy VP8 chunk with a wrong first sync byte', () => {
    const noSyncFirst = toBuffer(
      [
        0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38,
        0x20, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x2a, 0x80, 0x02, 0xe0, 0x01,
      ],
      30,
    );

    expect(readImageDimensions(noSyncFirst, 'image/webp')).toBeUndefined();
  });

  it('returns undefined for a lossy VP8 chunk with a wrong second sync byte', () => {
    const noSyncSecond = toBuffer(
      [
        0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38,
        0x20, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x9d, 0x00, 0x2a, 0x80, 0x02, 0xe0, 0x01,
      ],
      30,
    );

    expect(readImageDimensions(noSyncSecond, 'image/webp')).toBeUndefined();
  });

  it('returns undefined for a lossy VP8 chunk with a wrong third sync byte', () => {
    const noSyncThird = toBuffer(
      [
        0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38,
        0x20, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x9d, 0x01, 0x00, 0x80, 0x02, 0xe0, 0x01,
      ],
      30,
    );

    expect(readImageDimensions(noSyncThird, 'image/webp')).toBeUndefined();
  });

  it('returns undefined for a lossless VP8L chunk with a wrong signature byte', () => {
    const badVp8l = toBuffer(
      [
        0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38,
        0x4c, 0x00, 0x00, 0x00, 0x00, 0x00, 0x7f, 0xc2, 0x77, 0x00,
      ],
      30,
    );

    expect(readImageDimensions(badVp8l, 'image/webp')).toBeUndefined();
  });

  it('returns undefined for an unknown WebP chunk type', () => {
    const unknownChunk = toBuffer(
      [
        0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50, 0x41, 0x42, 0x43,
        0x44,
      ],
      30,
    );

    expect(readImageDimensions(unknownChunk, 'image/webp')).toBeUndefined();
  });
});

describe('readImageDimensions — dispatch', () => {
  it('normalizes the MIME type before dispatching', () => {
    expect(readImageDimensions(buildJpegBuffer(640, 480), 'IMAGE/JPEG')).toEqual({
      width: 640,
      height: 480,
    });
  });

  it('returns undefined for an unsupported MIME type', () => {
    expect(readImageDimensions(buildJpegBuffer(), 'image/gif')).toBeUndefined();
  });
});
