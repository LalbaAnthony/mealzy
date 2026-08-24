import { watchEffect } from 'vue';
import { storeToRefs } from 'pinia';
import { useSettingsStore } from '../stores/settings-store';

export function useTheme(): void {
  const settings = useSettingsStore();
  const { preferences } = storeToRefs(settings);

  watchEffect(() => {
    const preference = preferences.value.themePreference;
    const root = document.documentElement;
    if (preference === 'system') {
      root.removeAttribute('data-theme');
      return;
    }
    root.setAttribute('data-theme', preference);
  });
}
