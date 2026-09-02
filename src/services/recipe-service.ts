import type { RecipeId } from '../types/identifiers';
import type { MealPlanned } from '../types/meal';
import type { Recipe } from '../types/recipe';
import type { RecipeDraft, RecipeService, ServiceDependencies } from '../types/services';
import type { DomainResult } from '../types/validation';
import { formatIsoDateForDisplay } from '../domain/date/iso-date';
import { validateRecipeDraft } from '../domain/validation/recipe';
import { findPlannedMealsBlockingRecipeDeletion } from '../domain/validation/references';
import { fail, ok } from '../domain/validation/result';

function describeMeal(meal: MealPlanned): string {
  if (meal.scheduledDate === null) {
    return `${meal.recipeNameSnapshot} (no date)`;
  }
  const slot = meal.slot === null ? '' : ` ${meal.slot}`;
  return `${meal.recipeNameSnapshot} on ${formatIsoDateForDisplay(meal.scheduledDate)}${slot}`;
}

export function createRecipeService(dependencies: ServiceDependencies): RecipeService {
  const { recipes, ingredients, mealsPlanned } = dependencies.repositories;

  async function refreshPlannedSnapshots(recipeId: RecipeId, recipeName: string): Promise<void> {
    const meals = await mealsPlanned.getAll();
    const stale = meals.filter(
      (meal) =>
        meal.recipeId === recipeId &&
        meal.status === 'planned' &&
        meal.recipeNameSnapshot !== recipeName,
    );
    for (const meal of stale) {
      await mealsPlanned.put({
        ...meal,
        recipeNameSnapshot: recipeName,
        updatedAt: dependencies.clock.now(),
      });
    }
  }

  return {
    list(): Promise<readonly Recipe[]> {
      return recipes.getAll();
    },

    getById(id: RecipeId): Promise<Recipe | null> {
      return recipes.getById(id);
    },

    async create(draft: RecipeDraft): Promise<DomainResult<Recipe>> {
      const validation = validateRecipeDraft({
        draft,
        existingRecipes: await recipes.getAll(),
        ingredients: await ingredients.getAll(),
        recipeIdInEdit: null,
      });
      if (!validation.ok) {
        return validation;
      }

      const now = dependencies.clock.now();
      const recipe: Recipe = {
        id: dependencies.ids.next(),
        name: validation.value.name,
        notes: validation.value.notes,
        instructions: validation.value.instructions,
        ingredients: validation.value.ingredients,
        createdAt: now,
        updatedAt: now,
      };
      await recipes.put(recipe);
      return ok(recipe);
    },

    async update(id: RecipeId, draft: RecipeDraft): Promise<DomainResult<Recipe>> {
      const existing = await recipes.getById(id);
      if (existing === null) {
        return fail('entity-not-found', 'That recipe no longer exists.', [id]);
      }

      const validation = validateRecipeDraft({
        draft,
        existingRecipes: await recipes.getAll(),
        ingredients: await ingredients.getAll(),
        recipeIdInEdit: id,
      });
      if (!validation.ok) {
        return validation;
      }

      const updated: Recipe = {
        ...existing,
        name: validation.value.name,
        notes: validation.value.notes,
        instructions: validation.value.instructions,
        ingredients: validation.value.ingredients,
        updatedAt: dependencies.clock.now(),
      };
      await recipes.put(updated);
      await refreshPlannedSnapshots(id, updated.name);
      return ok(updated);
    },

    async remove(id: RecipeId): Promise<DomainResult<void>> {
      const existing = await recipes.getById(id);
      if (existing === null) {
        return fail('entity-not-found', 'That recipe no longer exists.', [id]);
      }

      const blockers = findPlannedMealsBlockingRecipeDeletion(id, await mealsPlanned.getAll());
      if (blockers.length > 0) {
        return fail(
          'recipe-referenced-by-planned-meals',
          `${existing.name} is still planned and cannot be deleted.`,
          blockers.map(describeMeal),
        );
      }

      await recipes.remove(id);
      return ok(undefined);
    },
  };
}
