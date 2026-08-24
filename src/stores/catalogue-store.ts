import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { CategoryId, IngredientId } from '../types/identifiers';
import type { Category, Ingredient } from '../types/ingredient';
import type { IngredientDraft } from '../types/services';
import type { LoadStatus, SelectOption } from '../types/ui';
import { useServices } from '../app/container';
import { useUiStore } from './ui-store';

export const useCatalogueStore = defineStore('catalogue', () => {
  const categories = ref<Category[]>([]);
  const ingredients = ref<Ingredient[]>([]);
  const status = ref<LoadStatus>('idle');
  const ui = useUiStore();

  const categoryOptions = computed<SelectOption[]>(() =>
    [...categories.value]
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map((category) => ({ value: category.id, label: category.name })),
  );

  const ingredientOptions = computed<SelectOption[]>(() =>
    [...ingredients.value]
      .sort((left, right) => left.name.localeCompare(right.name, 'en', { sensitivity: 'base' }))
      .map((ingredient) => ({ value: ingredient.id, label: ingredient.name })),
  );

  const sortedIngredients = computed(() =>
    [...ingredients.value].sort((left, right) =>
      left.name.localeCompare(right.name, 'en', { sensitivity: 'base' }),
    ),
  );

  const sortedCategories = computed(() =>
    [...categories.value].sort((left, right) => left.sortOrder - right.sortOrder),
  );

  function ingredientName(id: IngredientId): string {
    return ingredients.value.find((ingredient) => ingredient.id === id)?.name ?? 'Unknown';
  }

  function categoryName(id: CategoryId): string {
    return categories.value.find((category) => category.id === id)?.name ?? 'Uncategorized';
  }

  async function load(): Promise<void> {
    status.value = 'loading';
    const services = useServices();
    categories.value = [...(await services.categories.list())];
    ingredients.value = [...(await services.ingredients.list())];
    status.value = 'ready';
  }

  async function createCategory(name: string): Promise<boolean> {
    const result = await useServices().categories.create(name);
    if (!result.ok) {
      ui.notifyError(result.error);
      return false;
    }
    await load();
    ui.notifySuccess(`Added the category ${result.value.name}.`);
    return true;
  }

  async function renameCategory(id: CategoryId, name: string): Promise<boolean> {
    const result = await useServices().categories.rename(id, name);
    if (!result.ok) {
      ui.notifyError(result.error);
      return false;
    }
    await load();
    return true;
  }

  async function removeCategory(id: CategoryId): Promise<boolean> {
    const result = await useServices().categories.remove(id);
    if (!result.ok) {
      ui.notifyError(result.error);
      return false;
    }
    await load();
    ui.notifySuccess('Category deleted.');
    return true;
  }

  async function createIngredient(draft: IngredientDraft): Promise<boolean> {
    const result = await useServices().ingredients.create(draft);
    if (!result.ok) {
      ui.notifyError(result.error);
      return false;
    }
    await load();
    ui.notifySuccess(`Added ${result.value.name}.`);
    return true;
  }

  async function updateIngredient(id: IngredientId, draft: IngredientDraft): Promise<boolean> {
    const result = await useServices().ingredients.update(id, draft);
    if (!result.ok) {
      ui.notifyError(result.error);
      return false;
    }
    await load();
    return true;
  }

  async function removeIngredient(id: IngredientId): Promise<boolean> {
    const result = await useServices().ingredients.remove(id);
    if (!result.ok) {
      ui.notifyError(result.error);
      return false;
    }
    await load();
    ui.notifySuccess('Ingredient deleted.');
    return true;
  }

  return {
    categories,
    ingredients,
    status,
    categoryOptions,
    ingredientOptions,
    sortedIngredients,
    sortedCategories,
    ingredientName,
    categoryName,
    load,
    createCategory,
    renameCategory,
    removeCategory,
    createIngredient,
    updateIngredient,
    removeIngredient,
  };
});
