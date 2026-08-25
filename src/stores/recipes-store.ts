import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { RecipeId } from '../types/identifiers';
import type { Recipe } from '../types/recipe';
import type { RecipeDraft } from '../types/services';
import type { LoadStatus, SelectOption } from '../types/ui';
import { useServices } from '../app/container';
import { useUiStore } from './ui-store';

export const useRecipesStore = defineStore('recipes', () => {
  const recipes = ref<Recipe[]>([]);
  const status = ref<LoadStatus>('idle');
  const ui = useUiStore();

  const sortedRecipes = computed(() =>
    [...recipes.value].sort((left, right) =>
      left.name.localeCompare(right.name, 'en', { sensitivity: 'base' }),
    ),
  );

  const recipeOptions = computed<SelectOption[]>(() =>
    sortedRecipes.value.map((recipe) => ({ value: recipe.id, label: recipe.name })),
  );

  async function load(): Promise<void> {
    status.value = 'loading';
    recipes.value = [...(await useServices().recipes.list())];
    status.value = 'ready';
  }

  function findById(id: RecipeId): Recipe | null {
    return recipes.value.find((recipe) => recipe.id === id) ?? null;
  }

  async function create(draft: RecipeDraft): Promise<RecipeId | null> {
    const result = await useServices().recipes.create(draft);
    if (!result.ok) {
      ui.notifyError(result.error);
      return null;
    }
    await load();
    return result.value.id;
  }

  async function update(id: RecipeId, draft: RecipeDraft): Promise<boolean> {
    const result = await useServices().recipes.update(id, draft);
    if (!result.ok) {
      ui.notifyError(result.error);
      return false;
    }
    await load();
    return true;
  }

  async function remove(id: RecipeId): Promise<boolean> {
    const result = await useServices().recipes.remove(id);
    if (!result.ok) {
      ui.notifyError(result.error);
      return false;
    }
    await load();
    ui.notifySuccess('Recipe deleted.');
    return true;
  }

  return { recipes, status, sortedRecipes, recipeOptions, load, findById, create, update, remove };
});
