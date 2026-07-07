import type { ExecutionContext } from '@nestjs/common';
import { createParamDecorator } from '@nestjs/common';

import { STREAM_ID_HEADERS } from '@twinzy/shared';

import type { StreamMetaRequestLike, StreamRequestMeta } from './stream-meta.types';

const ORIGIN_HEADER = 'origin';

/** A header value is only usable when it arrived as a single string. */
const headerString = (value: string | string[] | undefined): string | undefined =>
  typeof value === 'string' ? value : undefined;

const extractStreamMeta = (_data: unknown, context: ExecutionContext): StreamRequestMeta => {
  const request = context.switchToHttp().getRequest<StreamMetaRequestLike>();
  return {
    origin: headerString(request.headers[ORIGIN_HEADER]),
    ip: request.ip ?? '',
    tabId: headerString(request.headers[STREAM_ID_HEADERS.tabId]),
    requestId: headerString(request.headers[STREAM_ID_HEADERS.requestId]),
  };
};

/**
 * Resolves the streaming endpoint's transport metadata (origin, client IP, and
 * the tab/request correlation ids) into a single object, keeping the controller
 * handler within the param budget and out of the vendor request type.
 */
export const StreamMeta = createParamDecorator(extractStreamMeta);
