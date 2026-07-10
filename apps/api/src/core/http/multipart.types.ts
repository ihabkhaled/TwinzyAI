import type { MULTIPART_PART_TYPE } from './multipart.constants';

/**
 * Structural contracts for the platform's multipart request parts. They are
 * satisfied by the Fastify multipart plugin objects without importing any
 * vendor types into core.
 */
export interface MultipartFileLike {
  readonly type: typeof MULTIPART_PART_TYPE.File;
  readonly fieldname: string;
  readonly filename: string;
  readonly mimetype: string;
  toBuffer(): Promise<Buffer>;
}

export interface MultipartFieldLike {
  readonly type: typeof MULTIPART_PART_TYPE.Field;
  readonly fieldname: string;
  readonly value: unknown;
}

export type MultipartPartLike = MultipartFileLike | MultipartFieldLike;

/** The subset of the platform request the upload interceptor needs. */
export interface MultipartRequestLike {
  parts(): AsyncIterableIterator<MultipartPartLike>;
}

/**
 * The parsed upload the interceptor produces. Structurally compatible with
 * the pipeline's UploadedImageFile so downstream code needs no cast.
 */
export interface ParsedUploadedFile {
  readonly originalname: string;
  readonly mimetype: string;
  readonly size: number;
  readonly buffer: Buffer;
}

export interface UploadedImagePayload {
  readonly file: ParsedUploadedFile | undefined;
  readonly body: Record<string, unknown>;
}

/** Mutable state used only while consuming one multipart iterator. */
export interface MultipartCollectionState {
  readonly body: Record<string, unknown>;
  file: ParsedUploadedFile | undefined;
  hasConsent: boolean;
}

/** Request augmentation carrying the parsed upload to the param decorators. */
export interface UploadCarrierRequestLike {
  uploadedImagePayload?: UploadedImagePayload;
}
