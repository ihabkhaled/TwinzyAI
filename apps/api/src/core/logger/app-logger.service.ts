import { Injectable, Scope } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

import type { AppLoggerPort, LogContext } from './logger.port';

/**
 * The only injectable logger for application code. Wraps the logging vendor
 * behind AppLoggerPort with an app-owned signature (message first, context
 * second). Transient so each consumer gets its own instance and context.
 */
@Injectable({ scope: Scope.TRANSIENT })
export class AppLogger implements AppLoggerPort {
  public constructor(private readonly pinoLogger: PinoLogger) {}

  public setContext(context: string): void {
    this.pinoLogger.setContext(context);
  }

  public debug(message: string, context?: LogContext): void {
    if (context === undefined) {
      this.pinoLogger.debug(message);
      return;
    }
    this.pinoLogger.debug(context, message);
  }

  public info(message: string, context?: LogContext): void {
    if (context === undefined) {
      this.pinoLogger.info(message);
      return;
    }
    this.pinoLogger.info(context, message);
  }

  public warn(message: string, context?: LogContext): void {
    if (context === undefined) {
      this.pinoLogger.warn(message);
      return;
    }
    this.pinoLogger.warn(context, message);
  }

  public error(message: string, context?: LogContext): void {
    if (context === undefined) {
      this.pinoLogger.error(message);
      return;
    }
    this.pinoLogger.error(context, message);
  }
}
