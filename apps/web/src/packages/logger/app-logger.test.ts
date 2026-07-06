import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { appLogger } from './app-logger';

const { envState } = vi.hoisted(() => ({
  envState: {
    appEnv: 'local',
    apiBaseUrl: 'http://localhost:4000',
  },
}));

vi.mock('@/packages/env', () => ({ publicEnv: envState }));

describe('appLogger', () => {
  beforeEach(() => {
    envState.appEnv = 'local';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('routes each level to the matching console method outside production', () => {
    const debugSpy = vi.spyOn(globalThis.console, 'debug').mockImplementation(vi.fn());
    const infoSpy = vi.spyOn(globalThis.console, 'info').mockImplementation(vi.fn());
    const warnSpy = vi.spyOn(globalThis.console, 'warn').mockImplementation(vi.fn());
    const errorSpy = vi.spyOn(globalThis.console, 'error').mockImplementation(vi.fn());

    appLogger.debug('d');
    appLogger.info('i');
    appLogger.warn('w');
    appLogger.error('e');

    expect(debugSpy).toHaveBeenCalledWith('d');
    expect(infoSpy).toHaveBeenCalledWith('i');
    expect(warnSpy).toHaveBeenCalledWith('w');
    expect(errorSpy).toHaveBeenCalledWith('e');
  });

  it('mutes debug and info in production but always logs warn and error', () => {
    envState.appEnv = 'production';

    const debugSpy = vi.spyOn(globalThis.console, 'debug').mockImplementation(vi.fn());
    const infoSpy = vi.spyOn(globalThis.console, 'info').mockImplementation(vi.fn());
    const warnSpy = vi.spyOn(globalThis.console, 'warn').mockImplementation(vi.fn());
    const errorSpy = vi.spyOn(globalThis.console, 'error').mockImplementation(vi.fn());

    appLogger.debug('d');
    appLogger.info('i');
    appLogger.warn('w');
    appLogger.error('e');

    expect(debugSpy).not.toHaveBeenCalled();
    expect(infoSpy).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  it('appends serialized context to the message', () => {
    const warnSpy = vi.spyOn(globalThis.console, 'warn').mockImplementation(vi.fn());

    appLogger.warn('event', { code: 7 });

    expect(warnSpy).toHaveBeenCalledWith('event {"code":7}');
  });
});
