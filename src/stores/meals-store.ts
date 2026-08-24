import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { MealPlannedId, RecipeId } from '../types/identifiers';
import type { MealFilter, MealPlanned } from '../types/meal';
import type { MealPlannedDraft } from '../types/services';
import type { LoadStatus } from '../types/ui';
import { sortPlannedMeals } from '../domain/ordering/meal-order';
import { useServices } from '../app/container';
import { useUiStore } from './ui-store';

export const useMealsStore = defineStore('meals', () => {
  const meals = ref<MealPlanned[]>([]);
  const filter = ref<MealFilter>('planned');
  const status = ref<LoadStatus>('idle');
  const ui = useUiStore();

  const visibleMeals = computed(() => {
    const matching = meals.value.filter((meal) => {
      if (filter.value === 'all') {
        return true;
      }
      return meal.status === filter.value;
    });
    return sortPlannedMeals(matching);
  });

  const plannedCount = computed(
    () => meals.value.filter((meal) => meal.status === 'planned').length,
  );

  async function load(): Promise<void> {
    status.value = 'loading';
    meals.value = [...(await useServices().meals.list())];
    status.value = 'ready';
  }

  function setFilter(next: MealFilter): void {
    filter.value = next;
  }

  async function plan(recipeId: RecipeId, draft: MealPlannedDraft): Promise<boolean> {
    const result = await useServices().meals.plan(recipeId, draft);
    if (!result.ok) {
      ui.notifyError(result.error);
      return false;
    }
    await load();
    ui.notifySuccess(`Planned ${result.value.recipeNameSnapshot}.`);
    return true;
  }

  async function update(id: MealPlannedId, draft: MealPlannedDraft): Promise<boolean> {
    const result = await useServices().meals.update(id, draft);
    if (!result.ok) {
      ui.notifyError(result.error);
      return false;
    }
    await load();
    return true;
  }

  async function markEaten(id: MealPlannedId): Promise<boolean> {
    const result = await useServices().meals.markEaten(id);
    if (!result.ok) {
      ui.notifyError(result.error);
      return false;
    }
    await load();
    ui.notifySuccess(`Marked ${result.value.recipeNameSnapshot} as eaten.`);
    return true;
  }

  async function markPlanned(id: MealPlannedId): Promise<boolean> {
    const result = await useServices().meals.markPlanned(id);
    if (!result.ok) {
      ui.notifyError(result.error);
      return false;
    }
    await load();
    ui.notifySuccess(`Moved ${result.value.recipeNameSnapshot} back to planned.`);
    return true;
  }

  async function moveUp(id: MealPlannedId): Promise<void> {
    await useServices().meals.moveUp(id);
    await load();
  }

  async function moveDown(id: MealPlannedId): Promise<void> {
    await useServices().meals.moveDown(id);
    await load();
  }

  async function remove(id: MealPlannedId): Promise<boolean> {
    const result = await useServices().meals.remove(id);
    if (!result.ok) {
      ui.notifyError(result.error);
      return false;
    }
    await load();
    ui.notifySuccess('Planned meal deleted.');
    return true;
  }

  return {
    meals,
    filter,
    status,
    visibleMeals,
    plannedCount,
    load,
    setFilter,
    plan,
    update,
    markEaten,
    markPlanned,
    moveUp,
    moveDown,
    remove,
  };
});
