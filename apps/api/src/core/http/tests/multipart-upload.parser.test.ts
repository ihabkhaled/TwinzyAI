import { describe, expect, it, vi } from 'vitest';

import {
  UPLOAD_CONSENT_FIELD_NAME,
  UPLOAD_CONSENT_GRANTED_VALUE,
  UPLOAD_FIELD_NAME,
} from '@twinzy/shared';

import { ErrorCode } from '../../errors/error-code.constants';
import { PayloadTooLargeError } from '../../errors/payload-too-large.error';
import { ValidationError } from '../../errors/validation.error';
import type { MultipartPartLike, MultipartRequestLike } from '../multipart.types';
import { parseMultipartUpload } from '../multipart-upload.parser';

const buildFilePart = (
  filename: string,
  content: string | Buffer,
  fieldname = UPLOAD_FIELD_NAME,
  onRead?: () => void,
): MultipartPartLike => {
  const buffer = typeof content === 'string' ? Buffer.from(content) : content;
  return {
    type: 'file',
    fieldname,
    filename,
    mimetype: 'image/jpeg',
    toBuffer: (): Promise<Buffer> => {
      onRead?.();
      return Promise.resolve(buffer);
    },
  };
};

const buildFieldPart = (fieldname: string, value: unknown): MultipartPartLike => ({
  type: 'field',
  fieldname,
  value,
});

const buildRequest = (
  parts: readonly MultipartPartLike[],
  failure?: Error,
): MultipartRequestLike => ({
  parts(): AsyncIterableIterator<MultipartPartLike> {
    const queue = [...parts];
    const iterator: AsyncIterableIterator<MultipartPartLike> = {
      next(): Promise<IteratorResult<MultipartPartLike>> {
        const value = queue.shift();
        if (value !== undefined) {
          return Promise.resolve({ done: false, value });
        }
        if (failure !== undefined) {
          return Promise.reject(failure);
        }
        return Promise.resolve({ done: true, value: undefined });
      },
      [Symbol.asyncIterator](): AsyncIterableIterator<MultipartPartLike> {
        return iterator;
      },
    };
    return iterator;
  },
});

const buildTransportError = (code: string): Error =>
  Object.assign(new Error('transport failure'), { code });

describe('parseMultipartUpload', () => {
  it('buffers the single file and collects text fields into the body', async () => {
    const request = buildRequest([
      buildFieldPart(UPLOAD_CONSENT_FIELD_NAME, UPLOAD_CONSENT_GRANTED_VALUE),
      buildFilePart('photo.jpg', 'jpeg-bytes'),
      buildFieldPart('note', 'after the file'),
    ]);

    const payload = await parseMultipartUpload(request);

    expect(payload.body).toEqual({ consent: 'true', note: 'after the file' });
    expect(payload.file?.originalname).toBe('photo.jpg');
    expect(payload.file?.mimetype).toBe('image/jpeg');
    expect(payload.file?.size).toBe(Buffer.from('jpeg-bytes').length);
    expect(payload.file?.buffer.equals(Buffer.from('jpeg-bytes'))).toBe(true);
  });

  it('leaves the file undefined when the request has only fields', async () => {
    const payload = await parseMultipartUpload(
      buildRequest([buildFieldPart(UPLOAD_CONSENT_FIELD_NAME, UPLOAD_CONSENT_GRANTED_VALUE)]),
    );

    expect(payload.file).toBeUndefined();
    expect(payload.body).toEqual({ consent: 'true' });
  });

  it('rejects a second file with the MULTIPLE_FILES_NOT_ALLOWED error', async () => {
    const firstBuffer = Buffer.from('first');
    const secondRead = vi.fn();
    const request = buildRequest([
      buildFieldPart(UPLOAD_CONSENT_FIELD_NAME, UPLOAD_CONSENT_GRANTED_VALUE),
      buildFilePart('a.jpg', firstBuffer),
      buildFilePart('b.jpg', 'second', UPLOAD_FIELD_NAME, secondRead),
    ]);

    await expect(parseMultipartUpload(request)).rejects.toBeInstanceOf(ValidationError);
    expect(firstBuffer.every((byte) => byte === 0)).toBe(true);
    expect(secondRead).not.toHaveBeenCalled();
  });

  it('maps the plugin files-limit error to MULTIPLE_FILES_NOT_ALLOWED', async () => {
    const firstBuffer = Buffer.from('first');
    const request = buildRequest(
      [
        buildFieldPart(UPLOAD_CONSENT_FIELD_NAME, UPLOAD_CONSENT_GRANTED_VALUE),
        buildFilePart('a.jpg', firstBuffer),
      ],
      buildTransportError('FST_FILES_LIMIT'),
    );

    await expect(parseMultipartUpload(request)).rejects.toBeInstanceOf(ValidationError);
    expect(firstBuffer.every((byte) => byte === 0)).toBe(true);
  });

  it('rejects a file before consent without buffering it', async () => {
    const read = vi.fn();
    const request = buildRequest([buildFilePart('a.jpg', 'first', UPLOAD_FIELD_NAME, read)]);

    await expect(parseMultipartUpload(request)).rejects.toMatchObject({
      errorCode: ErrorCode.ConsentRequired,
    });
    expect(read).not.toHaveBeenCalled();
  });

  it('rejects a non-canonical file field without buffering it', async () => {
    const read = vi.fn();
    const request = buildRequest([
      buildFieldPart(UPLOAD_CONSENT_FIELD_NAME, UPLOAD_CONSENT_GRANTED_VALUE),
      buildFilePart('a.jpg', 'first', 'other', read),
    ]);

    await expect(parseMultipartUpload(request)).rejects.toMatchObject({
      errorCode: ErrorCode.FileMissing,
    });
    expect(read).not.toHaveBeenCalled();
  });

  it('maps the plugin file-size error to the typed payload-too-large error', async () => {
    const request = buildRequest([], buildTransportError('FST_REQ_FILE_TOO_LARGE'));

    await expect(parseMultipartUpload(request)).rejects.toBeInstanceOf(PayloadTooLargeError);
  });

  it('degrades a non-multipart request to an empty payload', async () => {
    const request = buildRequest([], buildTransportError('FST_INVALID_MULTIPART_CONTENT_TYPE'));

    const payload = await parseMultipartUpload(request);

    expect(payload.file).toBeUndefined();
    expect(payload.body).toEqual({});
  });

  it('rethrows unrelated stream errors untouched', async () => {
    const failure = new Error('socket reset');
    const firstBuffer = Buffer.from('first');
    const request = buildRequest(
      [
        buildFieldPart(UPLOAD_CONSENT_FIELD_NAME, UPLOAD_CONSENT_GRANTED_VALUE),
        buildFilePart('a.jpg', firstBuffer),
      ],
      failure,
    );

    await expect(parseMultipartUpload(request)).rejects.toBe(failure);
    expect(firstBuffer.every((byte) => byte === 0)).toBe(true);
  });
});
