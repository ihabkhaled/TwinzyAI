import { IMAGE_MIME } from '@twinzy/shared';

import {
  JPEG_HEIGHT_OFFSET,
  JPEG_LENGTH_BIAS,
  JPEG_LENGTH_MIN,
  JPEG_LENGTH_OFFSET,
  JPEG_MARKER_PREFIX,
  JPEG_MIN_SOF_LENGTH,
  JPEG_SOF_MARKERS,
  JPEG_START_OFFSET,
  JPEG_WIDTH_OFFSET,
  PNG_HEIGHT_OFFSET,
  PNG_IHDR_SIZE,
  PNG_IHDR_TYPE_OFFSET,
  PNG_WIDTH_OFFSET,
  WEBP_CHUNK_HEADER_OFFSET,
  WEBP_CHUNK_HEADER_SIZE,
  WEBP_MIN_BUFFER_LENGTH,
  WEBP_PAYLOAD_OFFSET,
  WEBP_VP8_DIMENSION_MASK,
  WEBP_VP8_HEIGHT_OFFSET,
  WEBP_VP8_SYNC_CODE_A,
  WEBP_VP8_SYNC_CODE_B,
  WEBP_VP8_SYNC_CODE_C,
  WEBP_VP8_SYNC_OFFSET,
  WEBP_VP8_WIDTH_OFFSET,
  WEBP_VP8L_BITS_OFFSET,
  WEBP_VP8L_DIMENSION_BIAS,
  WEBP_VP8L_DIMENSION_MASK,
  WEBP_VP8L_FLAG_OFFSET,
  WEBP_VP8L_FLAG_VALUE,
  WEBP_VP8L_HEIGHT_SHIFT,
  WEBP_VP8X_DIMENSION_BIAS,
  WEBP_VP8X_DIMENSION_SIZE,
  WEBP_VP8X_HEIGHT_OFFSET,
  WEBP_VP8X_WIDTH_OFFSET,
} from '../model/image-format.constants';

export interface ImageDimensions {
  width: number;
  height: number;
}

const readJpegDimensions = (buffer: Buffer): ImageDimensions | undefined => {
  let offset = JPEG_START_OFFSET;

  while (offset + JPEG_MIN_SOF_LENGTH < buffer.length) {
    if (buffer[offset] !== JPEG_MARKER_PREFIX) {
      return undefined;
    }

    const marker = buffer[offset + 1];
    if (marker === undefined) {
      return undefined;
    }

    if (JPEG_SOF_MARKERS.has(marker)) {
      return {
        height: buffer.readUInt16BE(offset + JPEG_HEIGHT_OFFSET),
        width: buffer.readUInt16BE(offset + JPEG_WIDTH_OFFSET),
      };
    }

    const segmentLength = buffer.readUInt16BE(offset + JPEG_LENGTH_OFFSET);
    if (segmentLength < JPEG_LENGTH_MIN) {
      return undefined;
    }
    offset += JPEG_LENGTH_BIAS + segmentLength;
  }

  return undefined;
};

const readPngDimensions = (buffer: Buffer): ImageDimensions | undefined => {
  if (buffer.length < PNG_HEIGHT_OFFSET + PNG_IHDR_SIZE) {
    return undefined;
  }

  if (
    buffer.toString('ascii', PNG_IHDR_TYPE_OFFSET, PNG_IHDR_TYPE_OFFSET + PNG_IHDR_SIZE) !== 'IHDR'
  ) {
    return undefined;
  }

  return {
    width: buffer.readUInt32BE(PNG_WIDTH_OFFSET),
    height: buffer.readUInt32BE(PNG_HEIGHT_OFFSET),
  };
};

const readWebpDimensions = (buffer: Buffer): ImageDimensions | undefined => {
  if (buffer.length < WEBP_MIN_BUFFER_LENGTH) {
    return undefined;
  }

  const chunkType = buffer.toString(
    'ascii',
    WEBP_CHUNK_HEADER_OFFSET,
    WEBP_CHUNK_HEADER_OFFSET + WEBP_CHUNK_HEADER_SIZE,
  );

  if (chunkType === 'VP8X') {
    return {
      width:
        buffer.readUIntLE(WEBP_PAYLOAD_OFFSET + WEBP_VP8X_WIDTH_OFFSET, WEBP_VP8X_DIMENSION_SIZE) +
        WEBP_VP8X_DIMENSION_BIAS,
      height:
        buffer.readUIntLE(WEBP_PAYLOAD_OFFSET + WEBP_VP8X_HEIGHT_OFFSET, WEBP_VP8X_DIMENSION_SIZE) +
        WEBP_VP8X_DIMENSION_BIAS,
    };
  }

  if (chunkType === 'VP8 ') {
    const hasSyncCode =
      buffer[WEBP_PAYLOAD_OFFSET + WEBP_VP8_SYNC_OFFSET] === WEBP_VP8_SYNC_CODE_A &&
      buffer[WEBP_PAYLOAD_OFFSET + WEBP_VP8_SYNC_OFFSET + 1] === WEBP_VP8_SYNC_CODE_B &&
      buffer[WEBP_PAYLOAD_OFFSET + WEBP_VP8_SYNC_OFFSET + 2] === WEBP_VP8_SYNC_CODE_C;
    if (!hasSyncCode) {
      return undefined;
    }
    return {
      width:
        buffer.readUInt16LE(WEBP_PAYLOAD_OFFSET + WEBP_VP8_WIDTH_OFFSET) & WEBP_VP8_DIMENSION_MASK,
      height:
        buffer.readUInt16LE(WEBP_PAYLOAD_OFFSET + WEBP_VP8_HEIGHT_OFFSET) & WEBP_VP8_DIMENSION_MASK,
    };
  }

  if (chunkType === 'VP8L') {
    if (buffer[WEBP_PAYLOAD_OFFSET + WEBP_VP8L_FLAG_OFFSET] !== WEBP_VP8L_FLAG_VALUE) {
      return undefined;
    }
    const bits = buffer.readUInt32LE(WEBP_PAYLOAD_OFFSET + WEBP_VP8L_BITS_OFFSET);
    return {
      width: (bits & WEBP_VP8L_DIMENSION_MASK) + WEBP_VP8L_DIMENSION_BIAS,
      height:
        ((bits >> WEBP_VP8L_HEIGHT_SHIFT) & WEBP_VP8L_DIMENSION_MASK) + WEBP_VP8L_DIMENSION_BIAS,
    };
  }

  return undefined;
};

/**
 * Reads real header dimensions for the allowed image types. Returns
 * undefined when the structure does not parse — the caller rejects.
 */
export const readImageDimensions = (
  buffer: Buffer,
  mimeType: string,
): ImageDimensions | undefined => {
  switch (mimeType.toLowerCase()) {
    case IMAGE_MIME.jpeg: {
      return readJpegDimensions(buffer);
    }
    case IMAGE_MIME.png: {
      return readPngDimensions(buffer);
    }
    case IMAGE_MIME.webp: {
      return readWebpDimensions(buffer);
    }
    default: {
      return undefined;
    }
  }
};
