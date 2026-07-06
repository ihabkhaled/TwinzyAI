import type { AxiosRequestConfig, AxiosResponse } from 'axios';

export type HttpErrorKind = 'http' | 'network' | 'timeout' | 'aborted' | 'unknown';

export type HttpRequestConfig = AxiosRequestConfig;

export type HttpResponse<TData> = AxiosResponse<TData>;
