import type { ShoppingListGroup, ShoppingListLayout } from '../../types/shopping';

export function layoutShoppingList(groups: readonly ShoppingListGroup[]): ShoppingListLayout {
  const aisles = groups
    .map((group) => ({ ...group, lines: group.lines.filter((line) => !line.purchased) }))
    .filter((group) => group.lines.length > 0);
  const purchased = groups.flatMap((group) => group.lines.filter((line) => line.purchased));
  return { aisles, purchased };
}
