import { Injectable } from '@nestjs/common';

import { readImageDimensions } from '../lib/image-dimensions.helpers';
import {
  FILE_ERROR_MESSAGES,
  MAX_IMAGE_DIMENSION_PX,
  MIN_IMAGE_DIMENSION_PX,
} from '../model/file-security.constants';
import { InvalidImageError } from '../model/file-security.errors';

/**
 * Structural decode validation without native decoders: parses the real
 * image header (JPEG SOF / PNG IHDR / WebP VP8*) and rejects files whose
 * structure or dimensions are malformed or absurd. Catches truncated,
 * corrupt, and decompression-bomb-shaped files early.
 */
@Injectable()
export class ImageDecodeValidationService {
  public assertDecodable(buffer: Buffer, mimeType: string): void {
    const dimensions = readImageDimensions(buffer, mimeType);

    if (dimensions === undefined) {
      throw this.invalidFile();
    }

    const { width, height } = dimensions;
    const withinBounds =
      width >= MIN_IMAGE_DIMENSION_PX &&
      height >= MIN_IMAGE_DIMENSION_PX &&
      width <= MAX_IMAGE_DIMENSION_PX &&
      height <= MAX_IMAGE_DIMENSION_PX;

    if (!withinBounds) {
      throw this.invalidFile();
    }
  }

  private invalidFile(): InvalidImageError {
    return new InvalidImageError(FILE_ERROR_MESSAGES.fileInvalid);
  }
}
