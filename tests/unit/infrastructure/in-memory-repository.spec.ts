import { describe, expect, it } from 'vitest';
import {
  createInMemoryMetaRepository,
  createInMemoryRepository,
} from '../../../src/infrastructure/persistence/in-memory-repository';
import {
  StorageError,
  toStorageError,
} from '../../../src/infrastructure/persistence/storage-error';
import { makeCategory } from '../../support/factories';

describe('in memory repository', () => {
  it('stores, reads, replaces and removes entities', async () => {
    const repository = createInMemoryRepository([makeCategory({ id: 'a', name: 'A' })]);

    expect(await repository.getAll()).toHaveLength(1);
    expect(await repository.getById('a')).toMatchObject({ name: 'A' });
    expect(await repository.getById('missing')).toBeNull();

    await repository.put(makeCategory({ id: 'a', name: 'A renamed' }));
    expect(await repository.getById('a')).toMatchObject({ name: 'A renamed' });
    expect(await repository.getAll()).toHaveLength(1);

    await repository.put(makeCategory({ id: 'b', name: 'B' }));
    expect(await repository.getAll()).toHaveLength(2);

    await repository.remove('a');
    expect(await repository.getAll()).toHaveLength(1);

    await repository.remove('missing');
    expect(await repository.getAll()).toHaveLength(1);
  });
});

describe('in memory meta repository', () => {
  it('round trips schema version, purchased keys and preferences', async () => {
    const meta = createInMemoryMetaRepository({ themePreference: 'system' });

    expect(await meta.getSchemaVersion()).toBeNull();
    await meta.setSchemaVersion(1);
    expect(await meta.getSchemaVersion()).toBe(1);

    expect(await meta.getPurchasedKeys()).toEqual([]);
    await meta.setPurchasedKeys(['a', 'b']);
    expect(await meta.getPurchasedKeys()).toEqual(['a', 'b']);

    expect(await meta.getPreferences()).toEqual({ themePreference: 'system' });
    await meta.setPreferences({ themePreference: 'dark' });
    expect(await meta.getPreferences()).toEqual({ themePreference: 'dark' });
  });

  it('copies the purchased keys it is given', async () => {
    const meta = createInMemoryMetaRepository({ themePreference: 'system' });
    const keys = ['a'];

    await meta.setPurchasedKeys(keys);
    keys.push('b');

    expect(await meta.getPurchasedKeys()).toEqual(['a']);
  });
});

describe('storage failures', () => {
  it('maps a quota exception to an actionable message', () => {
    const error = toStorageError(new DOMException('full', 'QuotaExceededError'));

    expect(error.kind).toBe('quota-exceeded');
    expect(error.message).toContain('quota');
  });

  it('maps an unavailable store to a private browsing hint', () => {
    expect(toStorageError(new DOMException('nope', 'InvalidStateError')).kind).toBe('unavailable');
    expect(toStorageError(new DOMException('nope', 'SecurityError')).kind).toBe('unavailable');
  });

  it('passes an existing storage error through unchanged', () => {
    const original = new StorageError('corrupt-data', 'broken');

    expect(toStorageError(original)).toBe(original);
  });

  it('falls back to an unknown failure', () => {
    expect(toStorageError(new Error('boom')).kind).toBe('unknown');
    expect(toStorageError(new Error('boom')).message).toBe('boom');
    expect(toStorageError('not an error').kind).toBe('unknown');
    expect(toStorageError(new DOMException('other', 'AbortError')).kind).toBe('unknown');
  });
});
