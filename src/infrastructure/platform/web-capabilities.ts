import type {
  ClipboardPort,
  FileDownloadPort,
  SharePayload,
  SharePort,
  StoragePersistencePort,
} from '../../types/ports';
import type { StoragePersistenceState, StorageStatus } from '../../types/settings';

export function createClipboardPort(): ClipboardPort {
  return {
    isSupported(): boolean {
      return (
        typeof navigator !== 'undefined' &&
        typeof navigator.clipboard === 'object' &&
        typeof navigator.clipboard.writeText === 'function'
      );
    },
    async write(text: string): Promise<void> {
      await navigator.clipboard.writeText(text);
    },
  };
}

export function createSharePort(): SharePort {
  return {
    isSupported(): boolean {
      return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
    },
    async share(payload: SharePayload): Promise<void> {
      await navigator.share({ title: payload.title, text: payload.text });
    },
  };
}

export function createFileDownloadPort(): FileDownloadPort {
  return {
    download(fileName: string, contents: string, mimeType: string): void {
      const blob = new Blob([contents], { type: mimeType });
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = fileName;
      anchor.rel = 'noopener';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    },
  };
}

function isStorageManagerAvailable(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.storage === 'object';
}

async function readPersistenceState(): Promise<StoragePersistenceState> {
  if (typeof navigator.storage.persisted !== 'function') {
    return 'unknown';
  }
  try {
    return (await navigator.storage.persisted()) ? 'persisted' : 'not-persisted';
  } catch {
    return 'unknown';
  }
}

async function readStorageEstimate(): Promise<StorageEstimate> {
  if (typeof navigator.storage.estimate !== 'function') {
    return {};
  }
  try {
    return await navigator.storage.estimate();
  } catch {
    return {};
  }
}

export function createStoragePersistencePort(): StoragePersistencePort {
  return {
    async requestPersistence(): Promise<StoragePersistenceState> {
      if (!isStorageManagerAvailable() || typeof navigator.storage.persist !== 'function') {
        return 'unsupported';
      }
      try {
        if (await navigator.storage.persisted()) {
          return 'persisted';
        }
        return (await navigator.storage.persist()) ? 'persisted' : 'not-persisted';
      } catch {
        return 'unknown';
      }
    },

    async getStatus(): Promise<StorageStatus> {
      if (!isStorageManagerAvailable()) {
        return { persistence: 'unsupported', usageBytes: null, quotaBytes: null };
      }

      const persistence = await readPersistenceState();
      const estimate = await readStorageEstimate();

      return {
        persistence,
        usageBytes: estimate.usage ?? null,
        quotaBytes: estimate.quota ?? null,
      };
    },
  };
}
