/** JPEG segment markers and dimension offsets. */
export const JPEG_SOF_MARKERS = new Set([
  0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
]);

export const JPEG_START_OFFSET = 2;
export const JPEG_MIN_SOF_LENGTH = 9;
export const JPEG_MARKER_PREFIX = 0xff;
export const JPEG_HEIGHT_OFFSET = 5;
export const JPEG_WIDTH_OFFSET = 7;
export const JPEG_LENGTH_OFFSET = 2;
export const JPEG_LENGTH_MIN = 2;
export const JPEG_LENGTH_BIAS = 2;

/** PNG IHDR chunk offsets. */
export const PNG_IHDR_TYPE_OFFSET = 12;
export const PNG_WIDTH_OFFSET = 16;
export const PNG_HEIGHT_OFFSET = 20;
export const PNG_IHDR_SIZE = 4;

/** WebP chunk and payload offsets. */
export const WEBP_CHUNK_HEADER_OFFSET = 12;
export const WEBP_PAYLOAD_OFFSET = 20;
export const WEBP_MIN_BUFFER_LENGTH = 30;
export const WEBP_CHUNK_HEADER_SIZE = 4;
export const WEBP_VP8X_WIDTH_OFFSET = 4;
export const WEBP_VP8X_HEIGHT_OFFSET = 7;
export const WEBP_VP8X_DIMENSION_SIZE = 3;
export const WEBP_VP8X_DIMENSION_BIAS = 1;
export const WEBP_VP8_SYNC_OFFSET = 3;
export const WEBP_VP8_SYNC_CODE_A = 0x9d;
export const WEBP_VP8_SYNC_CODE_B = 0x01;
export const WEBP_VP8_SYNC_CODE_C = 0x2a;
export const WEBP_VP8_WIDTH_OFFSET = 6;
export const WEBP_VP8_HEIGHT_OFFSET = 8;
export const WEBP_VP8_DIMENSION_MASK = 0x3f_ff;
export const WEBP_VP8L_FLAG_OFFSET = 0;
export const WEBP_VP8L_FLAG_VALUE = 0x2f;
export const WEBP_VP8L_BITS_OFFSET = 1;
export const WEBP_VP8L_DIMENSION_MASK = 0x3f_ff;
export const WEBP_VP8L_HEIGHT_SHIFT = 14;
export const WEBP_VP8L_DIMENSION_BIAS = 1;
