import type { ExecutionContext } from '@nestjs/common';
import { createParamDecorator } from '@nestjs/common';

import type { ParsedUploadedFile, UploadCarrierRequestLike } from './multipart.types';

const extractUploadedImage = (
  _data: unknown,
  context: ExecutionContext,
): ParsedUploadedFile | undefined => {
  const request = context.switchToHttp().getRequest<UploadCarrierRequestLike>();
  return request.uploadedImagePayload?.file;
};

/**
 * Resolves the in-memory file parsed by UploadedImageInterceptor; undefined
 * when the request carried no file.
 */
export const UploadedImage = createParamDecorator(extractUploadedImage);
