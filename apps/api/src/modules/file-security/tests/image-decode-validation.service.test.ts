import { describe, expect, it } from 'vitest';

import { buildCorruptJpegBuffer, buildJpegBuffer } from '../../../tests/fixtures/image-fixtures';
import { ImageDecodeValidationService } from '../application/image-decode-validation.service';
import { InvalidImageError } from '../model/file-security.errors';

/**
 * Direct unit coverage for the structural decode guard. Each dimension bound
 * (too small / too large, on both axes) and the undecodable path are hit in
 * isolation so no branch depends on the upstream chain reaching this step.
 */
describe('ImageDecodeValidationService', () => {
  const service = new ImageDecodeValidationService();

  it('accepts an in-bounds image', () => {
    expect(() => {
      service.assertDecodable(buildJpegBuffer(640, 480), 'image/jpeg');
    }).not.toThrow();
  });

  it('rejects a structurally undecodable image', () => {
    expect(() => {
      service.assertDecodable(buildCorruptJpegBuffer(), 'image/jpeg');
    }).toThrow(InvalidImageError);
  });

  it('rejects an unsupported MIME type that yields no dimensions', () => {
    expect(() => {
      service.assertDecodable(buildJpegBuffer(), 'image/gif');
    }).toThrow(InvalidImageError);
  });

  it('rejects width below the minimum bound', () => {
    expect(() => {
      service.assertDecodable(buildJpegBuffer(1, 480), 'image/jpeg');
    }).toThrow(InvalidImageError);
  });

  it('rejects height below the minimum bound', () => {
    expect(() => {
      service.assertDecodable(buildJpegBuffer(640, 1), 'image/jpeg');
    }).toThrow(InvalidImageError);
  });

  it('rejects width above the maximum bound', () => {
    expect(() => {
      service.assertDecodable(buildJpegBuffer(20_000, 480), 'image/jpeg');
    }).toThrow(InvalidImageError);
  });

  it('rejects height above the maximum bound', () => {
    expect(() => {
      service.assertDecodable(buildJpegBuffer(640, 20_000), 'image/jpeg');
    }).toThrow(InvalidImageError);
  });
});
