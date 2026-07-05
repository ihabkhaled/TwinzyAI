import { HttpStatus, Injectable } from '@nestjs/common';

import { ErrorCode } from '../../../common/constants/error-codes.constant';
import { DomainException } from '../../../common/exceptions/domain.exception';
import {
  FILE_ERROR_MESSAGES,
  IMAGE_MAGIC_BYTES,
  WEBP_FORMAT_MARKER,
  WEBP_MARKER_OFFSET,
} from '../constants/file-security.constants';

/**
 * Verifies the buffer's magic bytes match the DECLARED type. A renamed or
 * polyglot file (e.g. an executable with a .jpg name) fails here even if
 * the earlier metadata checks passed.
 */
@Injectable()
export class MagicByteValidationService {
  public assertMagicBytesMatch(buffer: Buffer, mimeType: string): void {
    const signature = IMAGE_MAGIC_BYTES[mimeType.toLowerCase()];
    if (signature === undefined) {
      throw this.invalidFile();
    }

    if (!this.startsWith(buffer, signature)) {
      throw this.invalidFile();
    }

    if (mimeType.toLowerCase() === 'image/webp' && !this.hasWebpMarker(buffer)) {
      throw this.invalidFile();
    }
  }

  private startsWith(buffer: Buffer, signature: readonly number[]): boolean {
    if (buffer.length < signature.length) {
      return false;
    }
    return signature.every((byte, index) => buffer[index] === byte);
  }

  private hasWebpMarker(buffer: Buffer): boolean {
    const markerEnd = WEBP_MARKER_OFFSET + WEBP_FORMAT_MARKER.length;
    if (buffer.length < markerEnd) {
      return false;
    }
    return buffer.toString('ascii', WEBP_MARKER_OFFSET, markerEnd) === WEBP_FORMAT_MARKER;
  }

  private invalidFile(): DomainException {
    return new DomainException(
      ErrorCode.FileInvalid,
      FILE_ERROR_MESSAGES.fileInvalid,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}
