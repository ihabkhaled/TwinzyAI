import { describe, expect, it } from 'vitest';

import { mirrorPublicFigureModalEnv } from './public-env-mirror';

describe('mirrorPublicFigureModalEnv', () => {
  it('leaves the public flag unset when the server-side flag is unset', () => {
    const environment = new Proxy({} as NodeJS.ProcessEnv, {
      set: (target, property, value): boolean => Reflect.set(target, property, String(value)),
    });

    mirrorPublicFigureModalEnv(environment);

    expect(environment.NEXT_PUBLIC_PUBLIC_FIGURE_MODAL_ENABLED).toBeUndefined();
  });

  it('makes the documented server flag authoritative over the public template mirror', () => {
    const environment = {
      NODE_ENV: 'test',
      NEXT_PUBLIC_PUBLIC_FIGURE_MODAL_ENABLED: 'false',
      WEB_PUBLIC_FIGURE_MODAL_ENABLED: 'true',
    } satisfies NodeJS.ProcessEnv;

    mirrorPublicFigureModalEnv(environment);

    expect(environment.NEXT_PUBLIC_PUBLIC_FIGURE_MODAL_ENABLED).toBe('true');
  });
});
