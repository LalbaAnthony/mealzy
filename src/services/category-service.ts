import type { CategoryId } from '../types/identifiers';
import type { Category } from '../types/ingredient';
import type { CategoryService, ServiceDependencies } from '../types/services';
import type { DomainResult } from '../types/validation';
import { isReservedCategory, validateCategoryName } from '../domain/validation/category';
import { findCategoryReferents, hasCategoryReferents } from '../domain/validation/references';
import { fail, ok } from '../domain/validation/result';

function nextSortOrder(categories: readonly Category[]): number {
  return (
    categories
      .filter((category) => !isReservedCategory(category))
      .reduce((highest, category) => Math.max(highest, category.sortOrder), 0) + 1
  );
}

export function createCategoryService(dependencies: ServiceDependencies): CategoryService {
  const { categories, ingredients, adHocItems } = dependencies.repositories;

  return {
    list(): Promise<readonly Category[]> {
      return categories.getAll();
    },

    async create(name: string): Promise<DomainResult<Category>> {
      const existingCategories = await categories.getAll();
      const validation = validateCategoryName({
        name,
        existingCategories,
        categoryIdInEdit: null,
      });
      if (!validation.ok) {
        return validation;
      }

      const category: Category = {
        id: dependencies.ids.next(),
        name: validation.value,
        sortOrder: nextSortOrder(existingCategories),
      };
      await categories.put(category);
      return ok(category);
    },

    async rename(id: CategoryId, name: string): Promise<DomainResult<Category>> {
      const existing = await categories.getById(id);
      if (existing === null) {
        return fail('entity-not-found', 'That category no longer exists.', [id]);
      }

      const existingCategories = await categories.getAll();
      const validation = validateCategoryName({
        name,
        existingCategories,
        categoryIdInEdit: id,
      });
      if (!validation.ok) {
        return validation;
      }

      const updated: Category = { ...existing, name: validation.value };
      await categories.put(updated);
      return ok(updated);
    },

    async remove(id: CategoryId): Promise<DomainResult<void>> {
      const existing = await categories.getById(id);
      if (existing === null) {
        return fail('entity-not-found', 'That category no longer exists.', [id]);
      }
      if (isReservedCategory(existing)) {
        return fail('category-reserved', 'The uncategorized category cannot be deleted.', []);
      }

      const referents = findCategoryReferents({
        categoryId: id,
        ingredients: await ingredients.getAll(),
        adHocItems: await adHocItems.getAll(),
      });
      if (hasCategoryReferents(referents)) {
        return fail(
          'category-referenced',
          `${existing.name} is still in use and cannot be deleted.`,
          [
            ...referents.ingredients.map((ingredient) => `Ingredient: ${ingredient.name}`),
            ...referents.adHocItems.map((item) => `Ad hoc item: ${item.label}`),
          ],
        );
      }

      await categories.remove(id);
      return ok(undefined);
    },
  };
}
