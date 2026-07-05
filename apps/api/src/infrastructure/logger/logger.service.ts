import { Injectable, Logger } from '@nestjs/common';

/**
 * The only logging wrapper business code may use. Wraps the Nest logger so
 * the logging backend can change without touching call sites, and so
 * redaction rules live in exactly one place.
 */
@Injectable()
export class LoggerService {
  private readonly logger = new Logger('Twinzy');

  public log(context: string, message: string): void {
    this.logger.log(`[${context}] ${message}`);
  }

  public warn(context: string, message: string): void {
    this.logger.warn(`[${context}] ${message}`);
  }

  public error(context: string, message: string, stack?: string): void {
    this.logger.error(`[${context}] ${message}`, stack);
  }

  public debug(context: string, message: string): void {
    this.logger.debug(`[${context}] ${message}`);
  }
}
