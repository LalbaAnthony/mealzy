import type { IngredientId } from '../types/identifiers';
import type { IngredientQuickCreateApi } from '../types/composables';
import { UNCATEGORIZED_CATEGORY_NAME } from '../domain/constants';
import { useCatalogueStore } from '../stores/catalogue-store';
import { useUiStore } from '../stores/ui-store';

export function useIngredientQuickCreate(): IngredientQuickCreateApi {
  const catalogue = useCatalogueStore();
  const ui = useUiStore();

  async function createFromSearch(name: string): Promise<IngredientId | null> {
    const id = await catalogue.createIngredientFromSearch(name);
    if (id === null) {
      return null;
    }
    ui.notifySuccess(`${catalogue.ingredientName(id)} added to ${UNCATEGORIZED_CATEGORY_NAME}.`);
    return id;
  }

  return { createFromSearch };
}
