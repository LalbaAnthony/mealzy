import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { AdHocItemId, ShoppingLineKey } from '../types/identifiers';
import type { AdHocItemDraft, ShoppingListSnapshot } from '../types/services';
import type { AdHocItem } from '../types/shopping';
import type { LoadStatus } from '../types/ui';
import { useServices } from '../app/container';
import { useUiStore } from './ui-store';

const EMPTY_SNAPSHOT: ShoppingListSnapshot = {
  groups: [],
  lines: [],
  purchasedCount: 0,
  totalCount: 0,
};

export const useShoppingStore = defineStore('shopping', () => {
  const snapshot = ref<ShoppingListSnapshot>(EMPTY_SNAPSHOT);
  const adHocItems = ref<AdHocItem[]>([]);
  const status = ref<LoadStatus>('idle');
  const ui = useUiStore();

  const isEmpty = computed(() => snapshot.value.totalCount === 0);
  const remainingCount = computed(() => snapshot.value.totalCount - snapshot.value.purchasedCount);

  async function load(): Promise<void> {
    status.value = 'loading';
    const services = useServices();
    snapshot.value = await services.shoppingList.getSnapshot();
    adHocItems.value = [...(await services.adHocItems.list())];
    status.value = 'ready';
  }

  async function setPurchased(key: ShoppingLineKey, purchased: boolean): Promise<void> {
    await useServices().shoppingList.setPurchased(key, purchased);
    await load();
  }

  async function resetTrip(): Promise<void> {
    await useServices().shoppingList.resetTrip();
    await load();
    ui.notifySuccess('Shopping trip reset.');
  }

  async function addAdHocItem(draft: AdHocItemDraft): Promise<boolean> {
    const result = await useServices().adHocItems.create(draft);
    if (!result.ok) {
      ui.notifyError(result.error);
      return false;
    }
    await load();
    return true;
  }

  async function removeAdHocItem(id: AdHocItemId): Promise<boolean> {
    const result = await useServices().adHocItems.remove(id);
    if (!result.ok) {
      ui.notifyError(result.error);
      return false;
    }
    await load();
    return true;
  }

  function buildExportText(): Promise<string> {
    return useServices().shoppingList.buildExportText();
  }

  return {
    snapshot,
    adHocItems,
    status,
    isEmpty,
    remainingCount,
    load,
    setPurchased,
    resetTrip,
    addAdHocItem,
    removeAdHocItem,
    buildExportText,
  };
});
