import type { ExecutionContext } from '@nestjs/common';
import { createParamDecorator } from '@nestjs/common';

import type { UploadCarrierRequestLike } from './multipart.types';

const extractMultipartBody = (
  _data: unknown,
  context: ExecutionContext,
): Record<string, unknown> => {
  const request = context.switchToHttp().getRequest<UploadCarrierRequestLike>();
  return request.uploadedImagePayload?.body ?? {};
};

/**
 * Resolves the text fields of the multipart request parsed by
 * UploadedImageInterceptor as a plain record.
 */
export const MultipartBody = createParamDecorator(extractMultipartBody);
