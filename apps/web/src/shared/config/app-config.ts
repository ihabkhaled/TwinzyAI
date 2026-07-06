import { APP_NAME } from '@twinzy/shared';

import { publicEnv } from '@/packages/env';

/** Resolved, read-only application configuration for the web app. */
export interface AppConfig {
  appName: string;
  appEnv: string;
  apiBaseUrl: string;
  isProduction: boolean;
}

const PRODUCTION_ENV = 'production';

/**
 * The single resolved config object the app reads at runtime. Environment
 * values come only from the validated `@/packages/env` facade — never from
 * `process.env` directly — so config stays typed, fail-fast, and testable.
 */
export const appConfig: AppConfig = {
  appName: APP_NAME,
  appEnv: publicEnv.appEnv,
  apiBaseUrl: publicEnv.apiBaseUrl,
  isProduction: publicEnv.appEnv === PRODUCTION_ENV,
};
