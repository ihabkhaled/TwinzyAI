import path from 'node:path';

import * as dotenv from 'dotenv';

/**
 * Loads .env files without overriding variables already present in the
 * process environment. Checks the app folder first, then the repo root,
 * so both `npm run dev:api` (cwd = apps/api) and Docker (cwd = /app) work.
 */
export const loadEnvFiles = (): void => {
  const candidates = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '../../.env'),
  ];

  dotenv.config({ path: candidates, override: false, quiet: true });
};
