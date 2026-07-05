import { vi } from 'vitest';

import type { AppConfigService } from '../../config/app-config.service';
import type { LoggerService } from '../../infrastructure/logger/logger.service';

export interface LoggerStub {
  logger: LoggerService;
  messages: () => string[];
}

export const buildLoggerStub = (): LoggerStub => {
  const calls: string[] = [];
  const record = (_context: string, message: string): void => {
    calls.push(message);
  };

  const logger = {
    log: vi.fn(record),
    warn: vi.fn(record),
    error: vi.fn(record),
    debug: vi.fn(record),
  } as unknown as LoggerService;

  return { logger, messages: () => [...calls] };
};

const CONFIG_DEFAULTS = {
  nodeEnv: 'test',
  isProduction: false,
  apiPort: 3001,
  corsAllowedOrigins: ['http://localhost:3000'],
  geminiApiKey: 'test-key',
  geminiModel: 'test-model',
  geminiTimeoutMs: 5000,
  maxImageSizeBytes: 5_242_880,
  enableClamAv: false,
  clamAvHost: 'localhost',
  clamAvPort: 3310,
};

export const buildConfigStub = (
  overrides: Partial<typeof CONFIG_DEFAULTS> = {},
): AppConfigService => ({ ...CONFIG_DEFAULTS, ...overrides }) as unknown as AppConfigService;
