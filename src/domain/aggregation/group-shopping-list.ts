import type { CategoryId } from '../../types/identifiers';
import type {
  ShoppingLine,
  ShoppingListGroup,
  ShoppingListGroupAccumulator,
  ShoppingListGroupingInput,
} from '../../types/shopping';
import {
  UNCATEGORIZED_CATEGORY_ID,
  UNCATEGORIZED_CATEGORY_NAME,
  UNCATEGORIZED_CATEGORY_SORT_ORDER,
} from '../constants';

function compareShoppingLines(left: ShoppingLine, right: ShoppingLine): number {
  const labelComparison = left.label.localeCompare(right.label, 'en', { sensitivity: 'base' });
  if (labelComparison !== 0) {
    return labelComparison;
  }
  return left.key.localeCompare(right.key, 'en');
}

function groupRank(group: ShoppingListGroupAccumulator): number {
  return group.categoryId === UNCATEGORIZED_CATEGORY_ID ? Number.MAX_SAFE_INTEGER : group.sortOrder;
}

function compareGroups(
  left: ShoppingListGroupAccumulator,
  right: ShoppingListGroupAccumulator,
): number {
  const rankComparison = groupRank(left) - groupRank(right);
  if (rankComparison !== 0) {
    return rankComparison;
  }
  return left.categoryName.localeCompare(right.categoryName, 'en', { sensitivity: 'base' });
}

export function groupShoppingList(input: ShoppingListGroupingInput): readonly ShoppingListGroup[] {
  const categoriesById = new Map(input.categories.map((category) => [category.id, category]));
  const fallbackCategory = categoriesById.get(UNCATEGORIZED_CATEGORY_ID) ?? null;
  const accumulators = new Map<CategoryId, ShoppingListGroupAccumulator>();

  for (const line of input.lines) {
    const category = categoriesById.get(line.categoryId) ?? fallbackCategory;
    const categoryId = category === null ? UNCATEGORIZED_CATEGORY_ID : category.id;
    const existing = accumulators.get(categoryId);
    if (existing === undefined) {
      accumulators.set(categoryId, {
        categoryId,
        categoryName: category === null ? UNCATEGORIZED_CATEGORY_NAME : category.name,
        sortOrder: category === null ? UNCATEGORIZED_CATEGORY_SORT_ORDER : category.sortOrder,
        lines: [line],
      });
      continue;
    }
    existing.lines.push(line);
  }

  return [...accumulators.values()].sort(compareGroups).map((accumulator) => ({
    categoryId: accumulator.categoryId,
    categoryName: accumulator.categoryName,
    lines: [...accumulator.lines].sort(compareShoppingLines),
  }));
}
