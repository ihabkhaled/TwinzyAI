import { describe, expect, it } from 'vitest';

import {
  buildJpegBuffer,
  buildPngBuffer,
  buildWebpBuffer,
} from '../../../tests/fixtures/image-fixtures';
import { MagicByteValidationService } from '../application/magic-byte-validation.service';
import { InvalidImageError } from '../model/file-security.errors';

/**
 * Direct unit coverage for the magic-byte guard. Exercised in isolation so
 * every reject branch is reached — the full FileSecurityService chain short
 * circuits several of these on an earlier allowlist check.
 */
describe('MagicByteValidationService', () => {
  const service = new MagicByteValidationService();

  it('accepts a JPEG whose bytes match the declared type', () => {
    expect(() => {
      service.assertMagicBytesMatch(buildJpegBuffer(), 'image/jpeg');
    }).not.toThrow();
  });

  it('accepts a PNG whose bytes match the declared type', () => {
    expect(() => {
      service.assertMagicBytesMatch(buildPngBuffer(), 'image/png');
    }).not.toThrow();
  });

  it('accepts a WebP whose RIFF/WEBP structure is intact', () => {
    expect(() => {
      service.assertMagicBytesMatch(buildWebpBuffer(), 'image/webp');
    }).not.toThrow();
  });

  it('rejects an unsupported MIME type that has no known signature', () => {
    expect(() => {
      service.assertMagicBytesMatch(buildJpegBuffer(), 'image/gif');
    }).toThrow(InvalidImageError);
  });

  it('rejects a buffer shorter than the signature', () => {
    expect(() => {
      service.assertMagicBytesMatch(Buffer.from([0x89]), 'image/png');
    }).toThrow(InvalidImageError);
  });

  it('rejects a buffer whose leading bytes do not match the signature', () => {
    expect(() => {
      service.assertMagicBytesMatch(Buffer.from([0x00, 0x00, 0x00]), 'image/jpeg');
    }).toThrow(InvalidImageError);
  });

  it('rejects a RIFF container too short to hold the WEBP marker', () => {
    expect(() => {
      service.assertMagicBytesMatch(Buffer.from([0x52, 0x49, 0x46, 0x46]), 'image/webp');
    }).toThrow(InvalidImageError);
  });

  it('rejects a RIFF container missing the WEBP format marker', () => {
    const riffNotWebp = Buffer.from([
      0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x58, 0x58, 0x58, 0x58,
    ]);

    expect(() => {
      service.assertMagicBytesMatch(riffNotWebp, 'image/webp');
    }).toThrow(InvalidImageError);
  });
});
