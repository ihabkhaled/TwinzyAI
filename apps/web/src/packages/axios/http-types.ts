import type { AxiosRequestConfig } from 'axios';

export type HttpErrorKind = 'http' | 'network' | 'timeout' | 'aborted' | 'unknown';

export type HttpRequestConfig = AxiosRequestConfig;
