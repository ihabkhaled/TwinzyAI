import { publicEnv } from '@/packages/env';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogContext = Readonly<Record<string, unknown>>;

export interface AppLogger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
}

function isMuted(level: LogLevel): boolean {
  const isLowPriority = level === 'debug' || level === 'info';

  return isLowPriority && publicEnv.appEnv === 'production';
}

function formatLine(message: string, context?: LogContext): string {
  if (context === undefined) {
    return message;
  }

  return `${message} ${JSON.stringify(context)}`;
}

function writeLine(level: LogLevel, line: string): void {
  const target = globalThis.console;

  if (level === 'error') {
    target.error(line);

    return;
  }

  if (level === 'warn') {
    target.warn(line);

    return;
  }

  if (level === 'info') {
    target.info(line);

    return;
  }

  target.debug(line);
}

function emit(level: LogLevel, message: string, context?: LogContext): void {
  if (isMuted(level)) {
    return;
  }

  writeLine(level, formatLine(message, context));
}

/**
 * The single sanctioned console owner. `debug`/`info` are muted in production;
 * `warn`/`error` always emit. Every other module logs through this facade so
 * no raw `console.*` call ever ships elsewhere.
 */
export const appLogger: AppLogger = {
  debug(message: string, context?: LogContext): void {
    emit('debug', message, context);
  },
  info(message: string, context?: LogContext): void {
    emit('info', message, context);
  },
  warn(message: string, context?: LogContext): void {
    emit('warn', message, context);
  },
  error(message: string, context?: LogContext): void {
    emit('error', message, context);
  },
};
