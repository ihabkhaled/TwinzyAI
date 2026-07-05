import { describe, expect, it, vi } from 'vitest';

import { ErrorCode } from '../../../common/constants/error-codes.constant';
import { DomainException } from '../../../common/exceptions/domain.exception';
import {
  buildCorruptJpegBuffer,
  buildJpegBuffer,
  buildPngBuffer,
  buildUploadFile,
  buildWebpBuffer,
} from '../../../tests/fixtures/image-fixtures';
import { buildConfigStub, buildLoggerStub } from '../../../tests/fixtures/stubs';
import type { ClamAvAdapter } from '../adapters/clamav.adapter';
import { FileSecurityService } from '../services/file-security.service';
import { FileValidationService } from '../services/file-validation.service';
import { ImageDecodeValidationService } from '../services/image-decode-validation.service';
import { MagicByteValidationService } from '../services/magic-byte-validation.service';
import { VirusScanService } from '../services/virus-scan.service';

interface BuildOptions {
  enableClamAv?: boolean;
  clamAv?: Partial<ClamAvAdapter>;
}

const buildService = (options: BuildOptions = {}): FileSecurityService => {
  const config = buildConfigStub({ enableClamAv: options.enableClamAv ?? false });
  const { logger } = buildLoggerStub();
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

const expectRejection = async (
  action: Promise<unknown>,
  errorCode: string,
): Promise<void> => {
  let caught: unknown;
  try {
    await action;
  } catch (error) {
    caught = error;
  }

  expect(caught).toBeInstanceOf(DomainException);
  expect((caught as DomainException).errorCode).toBe(errorCode);
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

  it('rejects an invalid MIME type', async () => {
    const file = buildUploadFile({ mimetype: 'text/plain', originalname: 'notes.txt' });

    await expectRejection(
      buildService().assertSafeImage(file, true),
      ErrorCode.FileTypeNotAllowed,
    );
  });

  it('rejects a disallowed extension', async () => {
    const file = buildUploadFile({ originalname: 'photo.gif' });

    await expectRejection(
      buildService().assertSafeImage(file, true),
      ErrorCode.FileTypeNotAllowed,
    );
  });

  it('rejects a MIME/extension mismatch', async () => {
    const file = buildUploadFile({ mimetype: 'image/png', originalname: 'photo.jpg' });

    await expectRejection(
      buildService().assertSafeImage(file, true),
      ErrorCode.FileTypeNotAllowed,
    );
  });

  it('rejects an oversized file', async () => {
    const file = buildUploadFile({ size: 6_000_000 });

    await expectRejection(buildService().assertSafeImage(file, true), ErrorCode.FileTooLarge);
  });

  it('rejects a magic-byte mismatch (renamed file)', async () => {
    const file = buildUploadFile({ buffer: buildPngBuffer() });

    await expectRejection(buildService().assertSafeImage(file, true), ErrorCode.FileInvalid);
  });

  it('rejects a malformed image that does not decode', async () => {
    const file = buildUploadFile({ buffer: buildCorruptJpegBuffer() });

    await expectRejection(buildService().assertSafeImage(file, true), ErrorCode.FileInvalid);
  });

  it('rejects absurd decoded dimensions', async () => {
    const file = buildUploadFile({ buffer: buildJpegBuffer(1, 1) });

    await expectRejection(buildService().assertSafeImage(file, true), ErrorCode.FileInvalid);
  });

  it('rejects when consent is missing', async () => {
    const file = buildUploadFile();

    await expectRejection(
      buildService().assertSafeImage(file, false),
      ErrorCode.ConsentRequired,
    );
  });

  it('rejects when the file is missing', async () => {
    await expectRejection(
      buildService().assertSafeImage(undefined, true),
      ErrorCode.FileMissing,
    );
  });
});

describe('VirusScanService policy', () => {
  it('skips scanning when ClamAV is disabled', async () => {
    const scanBuffer = vi.fn();
    const service = buildService({ enableClamAv: false, clamAv: { scanBuffer } });

    await service.assertSafeImage(buildUploadFile(), true);

    expect(scanBuffer).not.toHaveBeenCalled();
  });

  it('rejects an infected file when scanning is enabled', async () => {
    const clamAv = {
      scanBuffer: vi.fn().mockResolvedValue({ clean: false, signature: 'Eicar-Test' }),
    };

    await expectRejection(
      buildService({ enableClamAv: true, clamAv }).assertSafeImage(buildUploadFile(), true),
      ErrorCode.VirusScanFailed,
    );
  });

  it('fails CLOSED when the scanner is unreachable', async () => {
    const clamAv = { scanBuffer: vi.fn().mockRejectedValue(new Error('ECONNREFUSED')) };

    await expectRejection(
      buildService({ enableClamAv: true, clamAv }).assertSafeImage(buildUploadFile(), true),
      ErrorCode.VirusScanFailed,
    );
  });
});
