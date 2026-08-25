import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { AppPreferences, StorageStatus, ThemePreference } from '../types/settings';
import type { LocalDataSummary } from '../types/services';
import { useServices } from '../app/container';

const EMPTY_SUMMARY: LocalDataSummary = {
  recipes: 0,
  plannedMeals: 0,
  ingredients: 0,
  categories: 0,
  staples: 0,
  adHocItems: 0,
  purchasedTicks: 0,
};

export const useSettingsStore = defineStore('settings', () => {
  const preferences = ref<AppPreferences>({ themePreference: 'system' });
  const storageStatus = ref<StorageStatus>({
    persistence: 'unknown',
    usageBytes: null,
    quotaBytes: null,
  });
  const dataSummary = ref<LocalDataSummary>(EMPTY_SUMMARY);

  async function load(): Promise<void> {
    const services = useServices();
    preferences.value = await services.settings.getPreferences();
    storageStatus.value = await services.settings.getStorageStatus();
    dataSummary.value = await services.dataReset.summarise();
  }

  async function setThemePreference(preference: ThemePreference): Promise<void> {
    preferences.value = await useServices().settings.setThemePreference(preference);
  }

  async function requestPersistence(): Promise<void> {
    const services = useServices();
    await services.settings.requestPersistence();
    storageStatus.value = await services.settings.getStorageStatus();
  }

  async function eraseAllData(): Promise<void> {
    await useServices().dataReset.eraseEverything();
    await load();
  }

  return {
    preferences,
    storageStatus,
    dataSummary,
    load,
    setThemePreference,
    requestPersistence,
    eraseAllData,
  };
});
