import type { MealPlannedId, RecipeId } from '../types/identifiers';
import type { MealPlanned } from '../types/meal';
import type { MealMoveDirection } from '../types/ordering';
import type { MealPlanService, MealPlannedDraft, ServiceDependencies } from '../types/services';
import type { DomainResult } from '../types/validation';
import { nextManualOrder, planMealMove } from '../domain/ordering/meal-order';
import { validateMealPlannedDraft } from '../domain/validation/meal';
import { fail, ok } from '../domain/validation/result';

export function createMealPlanService(dependencies: ServiceDependencies): MealPlanService {
  const { mealsPlanned, recipes } = dependencies.repositories;

  async function move(
    id: MealPlannedId,
    direction: MealMoveDirection,
  ): Promise<DomainResult<void>> {
    const meals = await mealsPlanned.getAll();
    const adjustments = planMealMove(meals, id, direction);
    const now = dependencies.clock.now();

    for (const adjustment of adjustments) {
      const meal = meals.find((candidate) => candidate.id === adjustment.mealPlannedId);
      if (meal !== undefined) {
        await mealsPlanned.put({ ...meal, manualOrder: adjustment.manualOrder, updatedAt: now });
      }
    }

    return ok(undefined);
  }

  return {
    list(): Promise<readonly MealPlanned[]> {
      return mealsPlanned.getAll();
    },

    async plan(recipeId: RecipeId, draft: MealPlannedDraft): Promise<DomainResult<MealPlanned>> {
      const allRecipes = await recipes.getAll();
      const validation = validateMealPlannedDraft({ draft, recipeId, recipes: allRecipes });
      if (!validation.ok) {
        return validation;
      }

      const recipe = allRecipes.find((candidate) => candidate.id === recipeId);
      if (recipe === undefined) {
        return fail('meal-recipe-unknown', 'That recipe no longer exists.', [recipeId]);
      }

      const now = dependencies.clock.now();
      const meal: MealPlanned = {
        id: dependencies.ids.next(),
        recipeId: recipe.id,
        recipeNameSnapshot: recipe.name,
        scheduledDate: validation.value.scheduledDate,
        slot: validation.value.slot,
        manualOrder: nextManualOrder(await mealsPlanned.getAll()),
        status: 'planned',
        eatenAt: null,
        createdAt: now,
        updatedAt: now,
      };
      await mealsPlanned.put(meal);
      return ok(meal);
    },

    async update(id: MealPlannedId, draft: MealPlannedDraft): Promise<DomainResult<MealPlanned>> {
      const existing = await mealsPlanned.getById(id);
      if (existing === null) {
        return fail('entity-not-found', 'That planned meal no longer exists.', [id]);
      }

      const validation = validateMealPlannedDraft({
        draft,
        recipeId: existing.recipeId,
        recipes: await recipes.getAll(),
      });
      if (!validation.ok) {
        return validation;
      }

      const updated: MealPlanned = {
        ...existing,
        scheduledDate: validation.value.scheduledDate,
        slot: validation.value.slot,
        updatedAt: dependencies.clock.now(),
      };
      await mealsPlanned.put(updated);
      return ok(updated);
    },

    async markEaten(id: MealPlannedId): Promise<DomainResult<MealPlanned>> {
      const existing = await mealsPlanned.getById(id);
      if (existing === null) {
        return fail('entity-not-found', 'That planned meal no longer exists.', [id]);
      }

      const now = dependencies.clock.now();
      const updated: MealPlanned = {
        ...existing,
        status: 'eaten',
        eatenAt: now,
        updatedAt: now,
      };
      await mealsPlanned.put(updated);
      return ok(updated);
    },

    async markPlanned(id: MealPlannedId): Promise<DomainResult<MealPlanned>> {
      const existing = await mealsPlanned.getById(id);
      if (existing === null) {
        return fail('entity-not-found', 'That planned meal no longer exists.', [id]);
      }

      const recipe = await recipes.getById(existing.recipeId);
      const updated: MealPlanned = {
        ...existing,
        recipeNameSnapshot: recipe === null ? existing.recipeNameSnapshot : recipe.name,
        status: 'planned',
        eatenAt: null,
        updatedAt: dependencies.clock.now(),
      };
      await mealsPlanned.put(updated);
      return ok(updated);
    },

    moveUp(id: MealPlannedId): Promise<DomainResult<void>> {
      return move(id, 'up');
    },

    moveDown(id: MealPlannedId): Promise<DomainResult<void>> {
      return move(id, 'down');
    },

    async remove(id: MealPlannedId): Promise<DomainResult<void>> {
      const existing = await mealsPlanned.getById(id);
      if (existing === null) {
        return fail('entity-not-found', 'That planned meal no longer exists.', [id]);
      }
      await mealsPlanned.remove(id);
      return ok(undefined);
    },
  };
}
