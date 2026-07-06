import type { UploadedImageFile } from '../../modules/file-security/model/upload-file.types';

const PAD_TO_MIN_SIZE = 128;

const pad = (bytes: number[]): Buffer => {
  const padded = [...bytes];
  while (padded.length < PAD_TO_MIN_SIZE) {
    padded.push(0);
  }
  return Buffer.from(padded);
};

/** Minimal structurally-valid JPEG: SOI + SOF0 (with dimensions) + EOI. */
export const buildJpegBuffer = (width = 640, height = 480): Buffer =>
  pad([
    0xff,
    0xd8,
    0xff,
    0xc0,
    0x00,
    0x11,
    0x08,
    (height >> 8) & 0xff,
    height & 0xff,
    (width >> 8) & 0xff,
    width & 0xff,
    0x03,
    0x01,
    0x22,
    0x00,
    0x02,
    0x11,
    0x01,
    0x03,
    0x11,
    0x01,
    0xff,
    0xd9,
  ]);

/** Minimal structurally-valid PNG: signature + IHDR chunk. */
export const buildPngBuffer = (width = 640, height = 480): Buffer => {
  const bytes = [
    0x89,
    0x50,
    0x4e,
    0x47,
    0x0d,
    0x0a,
    0x1a,
    0x0a,
    0x00,
    0x00,
    0x00,
    0x0d,
    0x49,
    0x48,
    0x44,
    0x52,
    (width >> 24) & 0xff,
    (width >> 16) & 0xff,
    (width >> 8) & 0xff,
    width & 0xff,
    (height >> 24) & 0xff,
    (height >> 16) & 0xff,
    (height >> 8) & 0xff,
    height & 0xff,
    0x08,
    0x06,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
  ];
  return pad(bytes);
};

/** Minimal structurally-valid WebP: RIFF/WEBP + VP8X chunk with canvas size. */
export const buildWebpBuffer = (width = 640, height = 480): Buffer => {
  const w = width - 1;
  const h = height - 1;
  const bytes = [
    0x52,
    0x49,
    0x46,
    0x46,
    0x24,
    0x00,
    0x00,
    0x00,
    0x57,
    0x45,
    0x42,
    0x50,
    0x56,
    0x50,
    0x38,
    0x58,
    0x0a,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    w & 0xff,
    (w >> 8) & 0xff,
    (w >> 16) & 0xff,
    h & 0xff,
    (h >> 8) & 0xff,
    (h >> 16) & 0xff,
  ];
  return pad(bytes);
};

/** JPEG magic bytes but no valid SOF anywhere — malformed image. */
export const buildCorruptJpegBuffer = (): Buffer =>
  pad([0xff, 0xd8, 0x00, 0x13, 0x37, 0x00, 0x42, 0x42, 0x42]);

export const buildUploadFile = (overrides: Partial<UploadedImageFile> = {}): UploadedImageFile => {
  const buffer = overrides.buffer ?? buildJpegBuffer();
  return {
    originalname: 'photo.jpg',
    mimetype: 'image/jpeg',
    size: buffer.length,
    buffer,
    ...overrides,
  };
};
