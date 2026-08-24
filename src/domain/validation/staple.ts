import type { StapleDraft } from '../../types/services';
import type { DomainResult, StapleValidationInput } from '../../types/validation';
import { isPositiveAmount } from './names';
import { fail, ok } from './result';

export function validateStapleDraft(input: StapleValidationInput): DomainResult<StapleDraft> {
  const ingredient = input.ingredients.find(
    (candidate) => candidate.id === input.draft.ingredientId,
  );
  if (ingredient === undefined) {
    return fail('staple-ingredient-unknown', 'The selected ingredient does not exist.', [
      input.draft.ingredientId,
    ]);
  }

  const duplicate = input.existingStaples.find(
    (staple) =>
      staple.id !== input.stapleIdInEdit && staple.ingredientId === input.draft.ingredientId,
  );
  if (duplicate !== undefined) {
    return fail('staple-ingredient-duplicate', `${ingredient.name} is already a staple.`, [
      ingredient.name,
    ]);
  }

  const quantity = input.draft.defaultQuantity;
  if (quantity !== null && !isPositiveAmount(quantity.amount)) {
    return fail('recipe-quantity-invalid', 'Quantities must be greater than zero.', [
      ingredient.name,
    ]);
  }

  return ok({
    ingredientId: ingredient.id,
    defaultQuantity: quantity,
    enabled: input.draft.enabled,
  });
}
