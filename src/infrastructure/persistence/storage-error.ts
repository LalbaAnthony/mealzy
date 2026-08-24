import type { StorageFailureKind } from '../../types/persistence';

export class StorageError extends Error {
  readonly kind: StorageFailureKind;

  constructor(kind: StorageFailureKind, message: string) {
    super(message);
    this.name = 'StorageError';
    this.kind = kind;
  }
}

export function toStorageError(error: unknown): StorageError {
  if (error instanceof StorageError) {
    return error;
  }
  if (error instanceof DOMException) {
    if (error.name === 'QuotaExceededError') {
      return new StorageError(
        'quota-exceeded',
        'The browser storage quota is full. Export a backup, then remove data you no longer need.',
      );
    }
    if (error.name === 'InvalidStateError' || error.name === 'SecurityError') {
      return new StorageError(
        'unavailable',
        'Browser storage is unavailable. Private browsing windows often block it.',
      );
    }
  }
  return new StorageError(
    'unknown',
    error instanceof Error ? error.message : 'An unknown storage failure occurred.',
  );
}
