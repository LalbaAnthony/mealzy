import type { IngredientId } from '../types/identifiers';
import type { Ingredient } from '../types/ingredient';
import type { IngredientDraft, IngredientService, ServiceDependencies } from '../types/services';
import type { DomainResult } from '../types/validation';
import { UNCATEGORIZED_CATEGORY_ID } from '../domain/constants';
import { validateIngredientDraft } from '../domain/validation/ingredient';
import { findIngredientReferents, hasIngredientReferents } from '../domain/validation/references';
import { fail, ok } from '../domain/validation/result';

export function createIngredientService(dependencies: ServiceDependencies): IngredientService {
  const { ingredients, categories, recipes, staples } = dependencies.repositories;

  async function create(draft: IngredientDraft): Promise<DomainResult<Ingredient>> {
    const validation = validateIngredientDraft({
      draft,
      existingIngredients: await ingredients.getAll(),
      categories: await categories.getAll(),
      ingredientIdInEdit: null,
    });
    if (!validation.ok) {
      return validation;
    }

    const now = dependencies.clock.now();
    const ingredient: Ingredient = {
      id: dependencies.ids.next(),
      name: validation.value.name,
      categoryId: validation.value.categoryId,
      createdAt: now,
      updatedAt: now,
    };
    await ingredients.put(ingredient);
    return ok(ingredient);
  }

  return {
    list(): Promise<readonly Ingredient[]> {
      return ingredients.getAll();
    },

    create,

    createFromSearch(name: string): Promise<DomainResult<Ingredient>> {
      return create({ name, categoryId: UNCATEGORIZED_CATEGORY_ID });
    },

    async update(id: IngredientId, draft: IngredientDraft): Promise<DomainResult<Ingredient>> {
      const existing = await ingredients.getById(id);
      if (existing === null) {
        return fail('entity-not-found', 'That ingredient no longer exists.', [id]);
      }

      const validation = validateIngredientDraft({
        draft,
        existingIngredients: await ingredients.getAll(),
        categories: await categories.getAll(),
        ingredientIdInEdit: id,
      });
      if (!validation.ok) {
        return validation;
      }

      const updated: Ingredient = {
        ...existing,
        name: validation.value.name,
        categoryId: validation.value.categoryId,
        updatedAt: dependencies.clock.now(),
      };
      await ingredients.put(updated);
      return ok(updated);
    },

    async remove(id: IngredientId): Promise<DomainResult<void>> {
      const existing = await ingredients.getById(id);
      if (existing === null) {
        return fail('entity-not-found', 'That ingredient no longer exists.', [id]);
      }

      const allIngredients = await ingredients.getAll();
      const referents = findIngredientReferents({
        ingredientId: id,
        recipes: await recipes.getAll(),
        staples: await staples.getAll(),
      });
      if (hasIngredientReferents(referents)) {
        const stapleNames = referents.staples.map((staple) => {
          const ingredient = allIngredients.find(
            (candidate) => candidate.id === staple.ingredientId,
          );
          return `Staple: ${ingredient === undefined ? staple.ingredientId : ingredient.name}`;
        });
        return fail(
          'ingredient-referenced',
          `${existing.name} is still referenced and cannot be deleted.`,
          [...referents.recipes.map((recipe) => `Recipe: ${recipe.name}`), ...stapleNames],
        );
      }

      await ingredients.remove(id);
      return ok(undefined);
    },
  };
}
