import type { IngredientId } from '../../types/identifiers';
import type { RecipeDraft } from '../../types/services';
import type {
  DomainResult,
  RecipeValidationInput,
  ResolvedRecipeIngredient,
} from '../../types/validation';
import { isPositiveAmount, namesMatch, normaliseName } from './names';
import { fail, ok } from './result';

export function validateRecipeDraft(input: RecipeValidationInput): DomainResult<RecipeDraft> {
  const name = normaliseName(input.draft.name);
  if (name.length === 0) {
    return fail('recipe-name-required', 'A recipe needs a name.', []);
  }

  const duplicateRecipe = input.existingRecipes.find(
    (recipe) => recipe.id !== input.recipeIdInEdit && namesMatch(recipe.name, name),
  );
  if (duplicateRecipe !== undefined) {
    return fail(
      'recipe-name-duplicate',
      `A recipe named "${duplicateRecipe.name}" already exists.`,
      [duplicateRecipe.name],
    );
  }

  const ingredientsById = new Map(
    input.ingredients.map((ingredient) => [ingredient.id, ingredient]),
  );
  const resolved: ResolvedRecipeIngredient[] = [];
  const unknownIngredientIds: IngredientId[] = [];
  for (const recipeIngredient of input.draft.ingredients) {
    const ingredient = ingredientsById.get(recipeIngredient.ingredientId);
    if (ingredient === undefined) {
      unknownIngredientIds.push(recipeIngredient.ingredientId);
      continue;
    }
    resolved.push({ ingredient, quantity: recipeIngredient.quantity });
  }
  if (unknownIngredientIds.length > 0) {
    return fail(
      'recipe-ingredient-unknown',
      'This recipe references ingredients that do not exist.',
      unknownIngredientIds,
    );
  }

  const seen = new Set<IngredientId>();
  const duplicated: string[] = [];
  for (const entry of resolved) {
    if (seen.has(entry.ingredient.id)) {
      duplicated.push(entry.ingredient.name);
    }
    seen.add(entry.ingredient.id);
  }
  if (duplicated.length > 0) {
    return fail(
      'recipe-ingredient-duplicate',
      'An ingredient can appear only once in a recipe.',
      duplicated,
    );
  }

  const invalidQuantities = resolved.filter(
    (entry) => entry.quantity !== null && !isPositiveAmount(entry.quantity.amount),
  );
  if (invalidQuantities.length > 0) {
    return fail(
      'recipe-quantity-invalid',
      'Quantities must be greater than zero.',
      invalidQuantities.map((entry) => entry.ingredient.name),
    );
  }

  return ok({
    name,
    notes: input.draft.notes.trim(),
    instructions: input.draft.instructions.trim(),
    ingredients: resolved.map((entry) => ({
      ingredientId: entry.ingredient.id,
      quantity: entry.quantity,
    })),
  });
}
