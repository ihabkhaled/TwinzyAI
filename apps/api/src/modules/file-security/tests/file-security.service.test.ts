import { HttpStatus } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { AppError, ErrorCode, PayloadTooLargeError, ValidationError } from '../../../core/errors';
import {
  buildCorruptJpegBuffer,
  buildJpegBuffer,
  buildPngBuffer,
  buildUploadFile,
  buildWebpBuffer,
} from '../../../tests/fixtures/image-fixtures';
import { buildAppLoggerStub, buildConfigStub } from '../../../tests/fixtures/stubs';
import type { ClamAvAdapter } from '../adapters/clamav.adapter';
import { FileSecurityService } from '../application/file-security.service';
import { FileValidationService } from '../application/file-validation.service';
import { ImageDecodeValidationService } from '../application/image-decode-validation.service';
import { MagicByteValidationService } from '../application/magic-byte-validation.service';
import { VirusScanService } from '../application/virus-scan.service';
import {
  InfectedFileError,
  InvalidImageError,
  UnsupportedImageTypeError,
  VirusScanUnavailableError,
} from '../model/file-security.errors';

interface BuildOptions {
  enableClamAv?: boolean;
  clamAv?: Partial<ClamAvAdapter>;
}

const buildService = (options: BuildOptions = {}): FileSecurityService => {
  const config = buildConfigStub({ enableClamAv: options.enableClamAv ?? false });
  const { logger } = buildAppLoggerStub();
  const clamAv = (options.clamAv ?? {
    scanBuffer: vi.fn().mockResolvedValue({ clean: true }),
  }) as ClamAvAdapter;

  return new FileSecurityService(
    new FileValidationService(config),
    new MagicByteValidationService(),
    new ImageDecodeValidationService(),
    new VirusScanService(config, clamAv, logger),
    logger,
  );
};

interface ThrownEnvelope {
  errorCode: string;
  status: number;
}

/**
 * Reads the wire envelope (errorCode + HTTP status) the global filter would
 * emit. Every rejection is now a typed AppError; locking errorCode + status
 * proves the migration preserves the exact envelope the shared integration
 * tests assert (400 / 413 / 415 / 422 / 503).
 */
const readThrown = (error: unknown): ThrownEnvelope => {
  if (error instanceof AppError) {
    return { errorCode: error.errorCode, status: error.status };
  }
  throw error;
};

const captureRejection = async (action: Promise<unknown>): Promise<unknown> => {
  let caught: unknown;
  try {
    await action;
  } catch (error) {
    caught = error;
  }
  expect(caught).toBeDefined();
  return caught;
};

const expectRejection = async (
  action: Promise<unknown>,
  errorCode: string,
  status: number,
): Promise<unknown> => {
  const caught = await captureRejection(action);
  const envelope = readThrown(caught);
  expect(envelope.errorCode).toBe(errorCode);
  expect(envelope.status).toBe(status);
  return caught;
};

describe('FileSecurityService validation chain', () => {
  it('accepts a valid JPG', async () => {
    const file = buildUploadFile({ buffer: buildJpegBuffer() });

    await expect(buildService().assertSafeImage(file, true)).resolves.toBe(file);
  });

  it('accepts a valid PNG', async () => {
    const file = buildUploadFile({
      buffer: buildPngBuffer(),
      originalname: 'photo.png',
      mimetype: 'image/png',
    });

    await expect(buildService().assertSafeImage(file, true)).resolves.toBe(file);
  });

  it('accepts a valid WebP', async () => {
    const file = buildUploadFile({
      buffer: buildWebpBuffer(),
      originalname: 'photo.webp',
      mimetype: 'image/webp',
    });

    await expect(buildService().assertSafeImage(file, true)).resolves.toBe(file);
  });

  it('rejects an invalid MIME type (415, UnsupportedImageTypeError)', async () => {
    const file = buildUploadFile({ mimetype: 'text/plain', originalname: 'notes.txt' });

    const caught = await expectRejection(
      buildService().assertSafeImage(file, true),
      ErrorCode.FileTypeNotAllowed,
      HttpStatus.UNSUPPORTED_MEDIA_TYPE,
    );
    expect(caught).toBeInstanceOf(UnsupportedImageTypeError);
  });

  it('rejects a disallowed extension (415)', async () => {
    const file = buildUploadFile({ originalname: 'photo.gif' });

    await expectRejection(
      buildService().assertSafeImage(file, true),
      ErrorCode.FileTypeNotAllowed,
      HttpStatus.UNSUPPORTED_MEDIA_TYPE,
    );
  });

  it('rejects a MIME/extension mismatch (415)', async () => {
    const file = buildUploadFile({ mimetype: 'image/png', originalname: 'photo.jpg' });

    await expectRejection(
      buildService().assertSafeImage(file, true),
      ErrorCode.FileTypeNotAllowed,
      HttpStatus.UNSUPPORTED_MEDIA_TYPE,
    );
  });

  it('rejects an oversized file (413, PayloadTooLargeError)', async () => {
    const file = buildUploadFile({ size: 6_000_000 });

    const caught = await expectRejection(
      buildService().assertSafeImage(file, true),
      ErrorCode.FileTooLarge,
      HttpStatus.PAYLOAD_TOO_LARGE,
    );
    expect(caught).toBeInstanceOf(PayloadTooLargeError);
  });

  it('rejects a magic-byte mismatch / renamed file (422, InvalidImageError)', async () => {
    const file = buildUploadFile({ buffer: buildPngBuffer() });

    const caught = await expectRejection(
      buildService().assertSafeImage(file, true),
      ErrorCode.FileInvalid,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(caught).toBeInstanceOf(InvalidImageError);
  });

  it('rejects a malformed image that does not decode (422)', async () => {
    const file = buildUploadFile({ buffer: buildCorruptJpegBuffer() });

    await expectRejection(
      buildService().assertSafeImage(file, true),
      ErrorCode.FileInvalid,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  });

  it('rejects absurd decoded dimensions (422)', async () => {
    const file = buildUploadFile({ buffer: buildJpegBuffer(1, 1) });

    await expectRejection(
      buildService().assertSafeImage(file, true),
      ErrorCode.FileInvalid,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  });

  it('rejects when consent is missing (400, ValidationError)', async () => {
    const file = buildUploadFile();

    const caught = await expectRejection(
      buildService().assertSafeImage(file, false),
      ErrorCode.ConsentRequired,
      HttpStatus.BAD_REQUEST,
    );
    expect(caught).toBeInstanceOf(ValidationError);
  });

  it('rejects when the file is missing (400, ValidationError)', async () => {
    const caught = await expectRejection(
      buildService().assertSafeImage(undefined, true),
      ErrorCode.FileMissing,
      HttpStatus.BAD_REQUEST,
    );
    expect(caught).toBeInstanceOf(ValidationError);
  });
});

describe('VirusScanService policy', () => {
  it('skips scanning when ClamAV is disabled', async () => {
    const scanBuffer = vi.fn();
    const service = buildService({ enableClamAv: false, clamAv: { scanBuffer } });

    await service.assertSafeImage(buildUploadFile(), true);

    expect(scanBuffer).not.toHaveBeenCalled();
  });

  it('rejects an infected file when scanning is enabled (422)', async () => {
    const clamAv = {
      scanBuffer: vi.fn().mockResolvedValue({ clean: false, signature: 'Eicar-Test' }),
    };

    const caught = await expectRejection(
      buildService({ enableClamAv: true, clamAv }).assertSafeImage(buildUploadFile(), true),
      ErrorCode.VirusScanFailed,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(caught).toBeInstanceOf(InfectedFileError);
  });

  it('fails CLOSED when the scanner is unreachable (503, VirusScanUnavailableError)', async () => {
    const clamAv = { scanBuffer: vi.fn().mockRejectedValue(new Error('ECONNREFUSED')) };

    const caught = await expectRejection(
      buildService({ enableClamAv: true, clamAv }).assertSafeImage(buildUploadFile(), true),
      ErrorCode.VirusScanFailed,
      HttpStatus.SERVICE_UNAVAILABLE,
    );
    expect(caught).toBeInstanceOf(VirusScanUnavailableError);
  });
});
