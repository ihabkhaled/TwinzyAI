export interface ImageDimensions {
  width: number;
  height: number;
}

const JPEG_SOF_MARKERS = new Set([
  0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
]);

const readJpegDimensions = (buffer: Buffer): ImageDimensions | undefined => {
  let offset = 2;

  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      return undefined;
    }

    const marker = buffer[offset + 1];
    if (marker === undefined) {
      return undefined;
    }

    if (JPEG_SOF_MARKERS.has(marker)) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }

    const segmentLength = buffer.readUInt16BE(offset + 2);
    if (segmentLength < 2) {
      return undefined;
    }
    offset += 2 + segmentLength;
  }

  return undefined;
};

const readPngDimensions = (buffer: Buffer): ImageDimensions | undefined => {
  const IHDR_TYPE_OFFSET = 12;
  const WIDTH_OFFSET = 16;
  const HEIGHT_OFFSET = 20;

  if (buffer.length < HEIGHT_OFFSET + 4) {
    return undefined;
  }

  if (buffer.toString('ascii', IHDR_TYPE_OFFSET, IHDR_TYPE_OFFSET + 4) !== 'IHDR') {
    return undefined;
  }

  return {
    width: buffer.readUInt32BE(WIDTH_OFFSET),
    height: buffer.readUInt32BE(HEIGHT_OFFSET),
  };
};

const readWebpDimensions = (buffer: Buffer): ImageDimensions | undefined => {
  const CHUNK_HEADER_OFFSET = 12;
  const PAYLOAD_OFFSET = 20;

  if (buffer.length < 30) {
    return undefined;
  }

  const chunkType = buffer.toString('ascii', CHUNK_HEADER_OFFSET, CHUNK_HEADER_OFFSET + 4);

  if (chunkType === 'VP8X') {
    return {
      width: buffer.readUIntLE(PAYLOAD_OFFSET + 4, 3) + 1,
      height: buffer.readUIntLE(PAYLOAD_OFFSET + 7, 3) + 1,
    };
  }

  if (chunkType === 'VP8 ') {
    const hasSyncCode =
      buffer[PAYLOAD_OFFSET + 3] === 0x9d &&
      buffer[PAYLOAD_OFFSET + 4] === 0x01 &&
      buffer[PAYLOAD_OFFSET + 5] === 0x2a;
    if (!hasSyncCode) {
      return undefined;
    }
    return {
      width: buffer.readUInt16LE(PAYLOAD_OFFSET + 6) & 0x3f_ff,
      height: buffer.readUInt16LE(PAYLOAD_OFFSET + 8) & 0x3f_ff,
    };
  }

  if (chunkType === 'VP8L') {
    if (buffer[PAYLOAD_OFFSET] !== 0x2f) {
      return undefined;
    }
    const bits = buffer.readUInt32LE(PAYLOAD_OFFSET + 1);
    return {
      width: (bits & 0x3f_ff) + 1,
      height: ((bits >> 14) & 0x3f_ff) + 1,
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
    case 'image/jpeg': {
      return readJpegDimensions(buffer);
    }
    case 'image/png': {
      return readPngDimensions(buffer);
    }
    case 'image/webp': {
      return readWebpDimensions(buffer);
    }
    default: {
      return undefined;
    }
  }
};
