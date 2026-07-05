/**
 * The subset of the multer memory-storage file the pipeline needs.
 * Narrowed on purpose: nothing downstream may touch paths or streams —
 * uploads exist only as an in-memory buffer.
 */
export interface UploadedImageFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}
