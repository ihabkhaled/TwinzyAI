import { describe, expect, it, vi } from 'vitest';

import { buildAppLoggerStub, buildConfigStub } from '../../../tests/fixtures/stubs';
import type { ClamAvAdapter } from '../adapters/clamav.adapter';
import { VirusScanService } from '../application/virus-scan.service';
import { InfectedFileError, VirusScanUnavailableError } from '../model/file-security.errors';

interface HarnessResult {
  service: VirusScanService;
  messages: () => string[];
}

const buildHarness = (enableClamAv: boolean, clamAv: Partial<ClamAvAdapter>): HarnessResult => {
  const config = buildConfigStub({ enableClamAv });
  const { logger, messages } = buildAppLoggerStub();
  const service = new VirusScanService(config, clamAv as ClamAvAdapter, logger);
  return { service, messages };
};

const SAMPLE = Buffer.from([0x00, 0x01, 0x02]);

describe('VirusScanService', () => {
  it('skips scanning entirely when ClamAV is disabled', async () => {
    const scanBuffer = vi.fn();
    const { service } = buildHarness(false, { scanBuffer });

    await expect(service.assertClean(SAMPLE)).resolves.toBeUndefined();
    expect(scanBuffer).not.toHaveBeenCalled();
  });

  it('passes a clean buffer when scanning is enabled', async () => {
    const scanBuffer = vi.fn().mockResolvedValue({ clean: true });
    const { service } = buildHarness(true, { scanBuffer });

    await expect(service.assertClean(SAMPLE)).resolves.toBeUndefined();
    expect(scanBuffer).toHaveBeenCalledOnce();
  });

  it('rejects an infected buffer', async () => {
    const scanBuffer = vi.fn().mockResolvedValue({ clean: false, signature: 'Eicar-Test' });
    const { service, messages } = buildHarness(true, { scanBuffer });

    await expect(service.assertClean(SAMPLE)).rejects.toBeInstanceOf(InfectedFileError);
    expect(messages().some((message) => message.includes('rejected by virus scanner'))).toBe(true);
  });

  it('fails closed when the scanner throws an Error', async () => {
    const scanBuffer = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));
    const { service, messages } = buildHarness(true, { scanBuffer });

    await expect(service.assertClean(SAMPLE)).rejects.toBeInstanceOf(VirusScanUnavailableError);
    expect(messages().some((message) => message.includes('ECONNREFUSED'))).toBe(true);
  });

  it('fails closed with a fallback reason when the scanner rejects with a non-Error', async () => {
    const scanBuffer = vi.fn().mockRejectedValue('socket hang up');
    const { service, messages } = buildHarness(true, { scanBuffer });

    await expect(service.assertClean(SAMPLE)).rejects.toBeInstanceOf(VirusScanUnavailableError);
    expect(messages().some((message) => message.includes('unknown scanner error'))).toBe(true);
  });
});
