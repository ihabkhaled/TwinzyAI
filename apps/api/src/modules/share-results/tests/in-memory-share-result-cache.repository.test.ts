import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { FinalGameResult } from '@twinzy/shared';

import { buildAppLoggerStub } from '../../../tests/fixtures/stubs';
import { InMemoryShareResultCacheRepository } from '../infrastructure/in-memory-share-result-cache.repository';
import type { StoredShareRecord } from '../model/share-result.types';

const buildRecord = (shareId: string, expiresAtMs: number): StoredShareRecord => ({
  shareId,
  languageCode: 'en',
  result: { languageCode: 'en' } as unknown as FinalGameResult,
  createdAtMs: Date.now(),
  expiresAtMs,
});

describe('InMemoryShareResultCacheRepository', () => {
  let repository: InMemoryShareResultCacheRepository;

  beforeEach(() => {
    repository = new InMemoryShareResultCacheRepository(buildAppLoggerStub().logger);
  });

  afterEach(() => {
    repository.onModuleDestroy();
  });

  it('stores and returns a live record', async () => {
    const record = buildRecord('a', Date.now() + 60_000);
    await repository.set(record);
    await expect(repository.get('a')).resolves.toEqual(record);
  });

  it('returns undefined for an unknown id', async () => {
    await expect(repository.get('missing')).resolves.toBeUndefined();
  });

  it('never returns an expired record and prunes it on read', async () => {
    await repository.set(buildRecord('old', Date.now() - 1000));
    await expect(repository.get('old')).resolves.toBeUndefined();
    // Pruned: it no longer counts toward size.
    await expect(repository.size()).resolves.toBe(0);
  });

  it('deletes a record idempotently', async () => {
    await repository.set(buildRecord('a', Date.now() + 60_000));
    await repository.delete('a');
    await repository.delete('a');
    await expect(repository.get('a')).resolves.toBeUndefined();
  });

  it('size counts only live records and prunes expired ones', async () => {
    await repository.set(buildRecord('live1', Date.now() + 60_000));
    await repository.set(buildRecord('live2', Date.now() + 60_000));
    await repository.set(buildRecord('dead', Date.now() - 1));
    await expect(repository.size()).resolves.toBe(2);
  });

  it('clears everything on module destroy', async () => {
    await repository.set(buildRecord('a', Date.now() + 60_000));
    repository.onModuleDestroy();
    await expect(repository.get('a')).resolves.toBeUndefined();
    await expect(repository.size()).resolves.toBe(0);
  });
});
