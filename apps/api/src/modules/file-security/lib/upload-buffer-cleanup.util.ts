import type { UploadedImageFile } from '../model/upload-file.types';

/** Zero-fills a populated upload buffer and reports whether work was done. */
export const wipeUploadedImageBuffer = (file: UploadedImageFile | undefined): boolean => {
  if (file === undefined || file.buffer.length === 0) {
    return false;
  }
  file.buffer.fill(0);
  return true;
};
