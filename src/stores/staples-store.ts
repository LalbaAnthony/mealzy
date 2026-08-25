import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { StapleId } from '../types/identifiers';
import type { StapleDraft } from '../types/services';
import type { Staple } from '../types/shopping';
import type { LoadStatus } from '../types/ui';
import { useServices } from '../app/container';
import { useCatalogueStore } from './catalogue-store';
import { useUiStore } from './ui-store';

export const useStaplesStore = defineStore('staples', () => {
  const staples = ref<Staple[]>([]);
  const status = ref<LoadStatus>('idle');
  const ui = useUiStore();
  const catalogue = useCatalogueStore();

  const sortedStaples = computed(() =>
    [...staples.value].sort((left, right) =>
      catalogue
        .ingredientName(left.ingredientId)
        .localeCompare(catalogue.ingredientName(right.ingredientId), 'en', {
          sensitivity: 'base',
        }),
    ),
  );

  async function load(): Promise<void> {
    status.value = 'loading';
    staples.value = [...(await useServices().staples.list())];
    status.value = 'ready';
  }

  async function create(draft: StapleDraft): Promise<boolean> {
    const result = await useServices().staples.create(draft);
    if (!result.ok) {
      ui.notifyError(result.error);
      return false;
    }
    await load();
    return true;
  }

  async function update(id: StapleId, draft: StapleDraft): Promise<boolean> {
    const result = await useServices().staples.update(id, draft);
    if (!result.ok) {
      ui.notifyError(result.error);
      return false;
    }
    await load();
    return true;
  }

  async function remove(id: StapleId): Promise<boolean> {
    const result = await useServices().staples.remove(id);
    if (!result.ok) {
      ui.notifyError(result.error);
      return false;
    }
    await load();
    ui.notifySuccess('Staple deleted.');
    return true;
  }

  return { staples, status, sortedStaples, load, create, update, remove };
});
