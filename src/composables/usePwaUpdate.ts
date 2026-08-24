import { useRegisterSW } from 'virtual:pwa-register/vue';
import type { PwaUpdateApi } from '../types/composables';

export function usePwaUpdate(): PwaUpdateApi {
  const { needRefresh, offlineReady, updateServiceWorker } = useRegisterSW({
    immediate: true,
  });

  async function applyUpdate(): Promise<void> {
    await updateServiceWorker(true);
  }

  function dismissUpdate(): void {
    needRefresh.value = false;
  }

  function dismissOfflineReady(): void {
    offlineReady.value = false;
  }

  return { needRefresh, offlineReady, applyUpdate, dismissUpdate, dismissOfflineReady };
}
