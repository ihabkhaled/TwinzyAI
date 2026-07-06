import { describe, expect, it } from 'vitest';

import { PayloadTooLargeError } from '../../errors/payload-too-large.error';
import { ValidationError } from '../../errors/validation.error';
import type { MultipartPartLike, MultipartRequestLike } from '../multipart.types';
import { parseMultipartUpload } from '../multipart-upload.parser';

const buildFilePart = (filename: string, content: string): MultipartPartLike => ({
  type: 'file',
  fieldname: 'image',
  filename,
  mimetype: 'image/jpeg',
  toBuffer: () => Promise.resolve(Buffer.from(content)),
});

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
      buildFieldPart('consent', 'true'),
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
    const payload = await parseMultipartUpload(buildRequest([buildFieldPart('consent', 'true')]));

    expect(payload.file).toBeUndefined();
    expect(payload.body).toEqual({ consent: 'true' });
  });

  it('rejects a second file with the MULTIPLE_FILES_NOT_ALLOWED error', async () => {
    const request = buildRequest([
      buildFilePart('a.jpg', 'first'),
      buildFilePart('b.jpg', 'second'),
    ]);

    await expect(parseMultipartUpload(request)).rejects.toBeInstanceOf(ValidationError);
  });

  it('maps the plugin files-limit error to MULTIPLE_FILES_NOT_ALLOWED', async () => {
    const request = buildRequest(
      [buildFilePart('a.jpg', 'first')],
      buildTransportError('FST_FILES_LIMIT'),
    );

    await expect(parseMultipartUpload(request)).rejects.toBeInstanceOf(ValidationError);
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
    const request = buildRequest([], failure);

    await expect(parseMultipartUpload(request)).rejects.toBe(failure);
  });
});
