import type { IngredientDraft } from '../../types/services';
import type { DomainResult, IngredientValidationInput } from '../../types/validation';
import { namesMatch, normaliseName } from './names';
import { fail, ok } from './result';

export function validateIngredientDraft(
  input: IngredientValidationInput,
): DomainResult<IngredientDraft> {
  const name = normaliseName(input.draft.name);
  if (name.length === 0) {
    return fail('ingredient-name-required', 'An ingredient needs a name.', []);
  }

  const duplicate = input.existingIngredients.find(
    (ingredient) => ingredient.id !== input.ingredientIdInEdit && namesMatch(ingredient.name, name),
  );
  if (duplicate !== undefined) {
    return fail(
      'ingredient-name-duplicate',
      `An ingredient named "${duplicate.name}" already exists.`,
      [duplicate.name],
    );
  }

  const category = input.categories.find((candidate) => candidate.id === input.draft.categoryId);
  if (category === undefined) {
    return fail('ingredient-category-unknown', 'The selected category does not exist.', [
      input.draft.categoryId,
    ]);
  }

  return ok({ name, categoryId: category.id });
}
