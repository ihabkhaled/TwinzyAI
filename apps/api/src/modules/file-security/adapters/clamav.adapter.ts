import { Socket } from 'node:net';

import { Injectable } from '@nestjs/common';

import { AppConfigService } from '../../../config/app-config.service';
import { AppLogger } from '../../../core/logger';
import type { ClamAvScanResult } from '../model/clamav.types';
import {
  CLAMAV_CHUNK_SIZE_BYTES,
  CLAMAV_FALLBACK_HOSTS,
  CLAMAV_TIMEOUT_MS,
} from '../model/file-security.constants';

const LOG_CONTEXT = 'ClamAvAdapter';

/**
 * Minimal ClamAV INSTREAM client over TCP — the only file that talks the
 * clamd wire protocol. Streams the buffer in length-prefixed chunks and
 * parses the OK/FOUND verdict. Errors are thrown raw; the VirusScanService
 * decides the fail-open/fail-closed policy.
 *
 * Reachability: the configured host is tried first, then the well-known
 * fallback hosts, so the same config works whether the API runs inside the
 * docker-compose network (`clamav`) or on the host (127.0.0.1) against a
 * ClamAV container's published port. The first reachable host is cached.
 */
@Injectable()
export class ClamAvAdapter {
  private reachableHost: string | undefined;

  public constructor(
    private readonly config: AppConfigService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(LOG_CONTEXT);
  }

  public async scanBuffer(buffer: Buffer): Promise<ClamAvScanResult> {
    const response = await this.streamToReachableHost(buffer);
    this.logger.debug(`clamd verdict: ${response}`);

    if (response.includes('OK') && !response.includes('FOUND')) {
      return { clean: true };
    }

    return { clean: false, signature: response };
  }

  private candidateHosts(): readonly string[] {
    return [
      ...new Set([this.reachableHost, this.config.clamAvHost, ...CLAMAV_FALLBACK_HOSTS]),
    ].filter((host): host is string => host !== undefined);
  }

  private async streamToReachableHost(buffer: Buffer): Promise<string> {
    const failures: string[] = [];

    for (const host of this.candidateHosts()) {
      try {
        const response = await this.sendInstream(host, buffer);
        if (this.reachableHost !== host) {
          this.reachableHost = host;
          this.logger.debug(`clamd reachable at ${host}:${String(this.config.clamAvPort)}`);
        }
        return response;
      } catch (error) {
        this.reachableHost = undefined;
        failures.push(`${host}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    throw new Error(`ClamAV unreachable (${failures.join('; ')})`);
  }

  private sendInstream(host: string, buffer: Buffer): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const socket = new Socket();
      let response = '';

      const fail = (error: Error): void => {
        socket.destroy();
        reject(error);
      };

      socket.setTimeout(CLAMAV_TIMEOUT_MS, () => {
        fail(new Error('ClamAV scan timed out'));
      });
      socket.on('error', fail);
      socket.on('data', (chunk: Buffer) => {
        response += chunk.toString('utf8');
      });
      socket.on('close', () => {
        if (response.length > 0) {
          resolve(response.trim());
        } else {
          reject(new Error('ClamAV closed the connection without a verdict'));
        }
      });

      socket.connect(this.config.clamAvPort, host, () => {
        socket.write('zINSTREAM\0');
        this.writeChunks(socket, buffer);
      });
    });
  }

  private writeChunks(socket: Socket, buffer: Buffer): void {
    for (let offset = 0; offset < buffer.length; offset += CLAMAV_CHUNK_SIZE_BYTES) {
      const chunk = buffer.subarray(offset, offset + CLAMAV_CHUNK_SIZE_BYTES);
      const sizePrefix = Buffer.alloc(4);
      sizePrefix.writeUInt32BE(chunk.length, 0);
      socket.write(sizePrefix);
      socket.write(chunk);
    }

    socket.write(Buffer.alloc(4));
    socket.end();
  }
}
