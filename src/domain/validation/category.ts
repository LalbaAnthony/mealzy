import type { Category } from '../../types/ingredient';
import type { CategoryValidationInput, DomainResult } from '../../types/validation';
import { UNCATEGORIZED_CATEGORY_ID } from '../constants';
import { namesMatch, normaliseName } from './names';
import { fail, ok } from './result';

export function isReservedCategory(category: Category): boolean {
  return category.id === UNCATEGORIZED_CATEGORY_ID;
}

export function validateCategoryName(input: CategoryValidationInput): DomainResult<string> {
  if (input.categoryIdInEdit === UNCATEGORIZED_CATEGORY_ID) {
    return fail('category-reserved', 'The uncategorized category cannot be renamed.', []);
  }

  const name = normaliseName(input.name);
  if (name.length === 0) {
    return fail('category-name-required', 'A category needs a name.', []);
  }

  const duplicate = input.existingCategories.find(
    (category) => category.id !== input.categoryIdInEdit && namesMatch(category.name, name),
  );
  if (duplicate !== undefined) {
    return fail('category-name-duplicate', `A category named "${duplicate.name}" already exists.`, [
      duplicate.name,
    ]);
  }

  return ok(name);
}
