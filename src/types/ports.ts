import type { EpochMillis, IsoDate } from './identifiers';
import type { BackupDocument } from './backup';
import type { DomainResult } from './validation';
import type { StoragePersistenceState, StorageStatus } from './settings';

export interface Clock {
  now(): EpochMillis;
  today(): IsoDate;
}

export interface IdGenerator {
  next(): string;
}

export interface SharePayload {
  readonly title: string;
  readonly text: string;
}

export interface ClipboardPort {
  isSupported(): boolean;
  write(text: string): Promise<void>;
}

export interface SharePort {
  isSupported(): boolean;
  share(payload: SharePayload): Promise<void>;
}

export interface FileDownloadPort {
  download(fileName: string, contents: string, mimeType: string): void;
}

export interface StoragePersistencePort {
  requestPersistence(): Promise<StoragePersistenceState>;
  getStatus(): Promise<StorageStatus>;
}

export interface BackupCodec {
  serialise(document: BackupDocument): string;
  parse(rawJson: string): DomainResult<BackupDocument>;
}
