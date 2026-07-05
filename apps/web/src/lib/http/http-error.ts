/**
 * Typed transport error surfaced by the HTTP client wrapper. Carries the
 * backend's stable errorCode so hooks can map it to a friendly i18n string.
 */
export class HttpClientError extends Error {
  public readonly status: number;

  public readonly errorCode: string;

  public constructor(status: number, errorCode: string, message: string) {
    super(message);
    this.name = 'HttpClientError';
    this.status = status;
    this.errorCode = errorCode;
  }
}

export const NETWORK_ERROR_CODE = 'NETWORK_ERROR';

export const INVALID_RESPONSE_CODE = 'INVALID_RESPONSE';
