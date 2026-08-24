export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export interface AppPreferences {
  readonly themePreference: ThemePreference;
}

export type StoragePersistenceState = 'unknown' | 'persisted' | 'not-persisted' | 'unsupported';

export interface StorageStatus {
  readonly persistence: StoragePersistenceState;
  readonly usageBytes: number | null;
  readonly quotaBytes: number | null;
}
