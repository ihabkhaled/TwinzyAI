import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import type { Observable } from 'rxjs';

import type { MultipartRequestLike, UploadCarrierRequestLike } from './multipart.types';
import { parseMultipartUpload } from './multipart-upload.parser';

/**
 * Parses the multipart upload into memory (never disk) and attaches the
 * result to the request for the @UploadedImage() and @MultipartBody() param
 * decorators. All upload-shape failures are typed AppErrors that keep the
 * legacy error envelope.
 */
@Injectable()
export class UploadedImageInterceptor implements NestInterceptor {
  public async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const request = context
      .switchToHttp()
      .getRequest<MultipartRequestLike & UploadCarrierRequestLike>();

    request.uploadedImagePayload = await parseMultipartUpload(request);

    return next.handle();
  }
}
