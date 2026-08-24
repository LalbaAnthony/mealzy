import type { MealPlannedDraft } from '../../types/services';
import type { DomainResult, MealPlanValidationInput } from '../../types/validation';
import { isValidIsoDate } from '../date/iso-date';
import { fail, ok } from './result';

export function validateMealPlannedDraft(
  input: MealPlanValidationInput,
): DomainResult<MealPlannedDraft> {
  const recipe = input.recipes.find((candidate) => candidate.id === input.recipeId);
  if (recipe === undefined) {
    return fail('meal-recipe-unknown', 'The selected recipe does not exist.', [input.recipeId]);
  }

  const scheduledDate = input.draft.scheduledDate;
  if (scheduledDate !== null && !isValidIsoDate(scheduledDate)) {
    return fail('meal-date-invalid', 'The scheduled date is not a valid calendar date.', [
      scheduledDate,
    ]);
  }

  return ok({ scheduledDate, slot: input.draft.slot });
}
