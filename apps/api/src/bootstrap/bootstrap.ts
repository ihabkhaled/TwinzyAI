import { AppConfigService } from '../config/app-config.service';
import { AppLogger } from '../core/logger/app-logger.service';

import { BOOTSTRAP_LOG_CONTEXT, LISTEN_HOST } from './bootstrap.constants';
import { configureLifecycle } from './configure-lifecycle';
import { configureSecurity } from './configure-security';
import { configureSwagger } from './configure-swagger';
import { configureValidation } from './configure-validation';
import { createApp } from './create-app';

/**
 * Bootstrap orchestrator: create the app, then apply each cross-cutting
 * concern through its dedicated configure-* step, then listen. Each step
 * lives in its own file so this stays a readable, testable recipe.
 */
export const bootstrap = async (): Promise<void> => {
  const app = await createApp();

  await configureSecurity(app);
  await configureValidation(app);
  configureLifecycle(app);

  const config = app.get(AppConfigService);
  if (config.swaggerEnabled) {
    configureSwagger(app);
  }

  await app.listen(config.apiPort, LISTEN_HOST);

  const logger = await app.resolve(AppLogger);
  logger.setContext(BOOTSTRAP_LOG_CONTEXT);
  logger.info(`API listening on port ${config.apiPort} (${config.nodeEnv})`);
};
