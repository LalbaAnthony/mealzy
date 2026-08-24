import type { AdHocItemDraft } from '../../types/services';
import type { AdHocItemValidationInput, DomainResult } from '../../types/validation';
import { UNCATEGORIZED_CATEGORY_ID } from '../constants';
import { isPositiveAmount, normaliseName } from './names';
import { fail, ok } from './result';

export function validateAdHocItemDraft(
  input: AdHocItemValidationInput,
): DomainResult<AdHocItemDraft> {
  const label = normaliseName(input.draft.label);
  if (label.length === 0) {
    return fail('adhoc-label-required', 'An ad hoc item needs a label.', []);
  }

  const quantity = input.draft.quantity;
  if (quantity !== null && !isPositiveAmount(quantity.amount)) {
    return fail('recipe-quantity-invalid', 'Quantities must be greater than zero.', [label]);
  }

  const category = input.categories.find((candidate) => candidate.id === input.draft.categoryId);
  const categoryId = category === undefined ? UNCATEGORIZED_CATEGORY_ID : category.id;

  return ok({ label, quantity, categoryId });
}
