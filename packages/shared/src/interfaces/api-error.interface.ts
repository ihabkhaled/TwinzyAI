/**
 * The safe error envelope every API error response uses.
 * Never contains provider errors, stack traces, or file contents.
 */
export interface ApiErrorResponse {
  statusCode: number;
  errorCode: string;
  message: string;
}
