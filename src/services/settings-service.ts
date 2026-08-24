import type { ServiceDependencies, SettingsService } from '../types/services';
import type {
  AppPreferences,
  StoragePersistenceState,
  StorageStatus,
  ThemePreference,
} from '../types/settings';

export function createSettingsService(dependencies: ServiceDependencies): SettingsService {
  const { meta } = dependencies.repositories;

  return {
    getPreferences(): Promise<AppPreferences> {
      return meta.getPreferences();
    },

    async setThemePreference(preference: ThemePreference): Promise<AppPreferences> {
      const current = await meta.getPreferences();
      const updated: AppPreferences = { ...current, themePreference: preference };
      await meta.setPreferences(updated);
      return updated;
    },

    getStorageStatus(): Promise<StorageStatus> {
      return dependencies.storagePersistence.getStatus();
    },

    requestPersistence(): Promise<StoragePersistenceState> {
      return dependencies.storagePersistence.requestPersistence();
    },
  };
}
