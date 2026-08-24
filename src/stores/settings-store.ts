import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { AppPreferences, StorageStatus, ThemePreference } from '../types/settings';
import { useServices } from '../app/container';

export const useSettingsStore = defineStore('settings', () => {
  const preferences = ref<AppPreferences>({ themePreference: 'system' });
  const storageStatus = ref<StorageStatus>({
    persistence: 'unknown',
    usageBytes: null,
    quotaBytes: null,
  });

  async function load(): Promise<void> {
    const services = useServices();
    preferences.value = await services.settings.getPreferences();
    storageStatus.value = await services.settings.getStorageStatus();
  }

  async function setThemePreference(preference: ThemePreference): Promise<void> {
    preferences.value = await useServices().settings.setThemePreference(preference);
  }

  async function requestPersistence(): Promise<void> {
    const services = useServices();
    await services.settings.requestPersistence();
    storageStatus.value = await services.settings.getStorageStatus();
  }

  return { preferences, storageStatus, load, setThemePreference, requestPersistence };
});
