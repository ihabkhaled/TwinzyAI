import { bootstrap } from './bootstrap/bootstrap';

import 'reflect-metadata';

bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? (error.stack ?? error.message) : String(error);
  process.stderr.write(`Fatal bootstrap error: ${message}\n`);
  process.exitCode = 1;
});
