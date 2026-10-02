import { describe, expect, it } from 'vitest';
import { layoutShoppingList } from '../../../src/domain/aggregation/layout-shopping-list';
import type { ShoppingLine, ShoppingListGroup } from '../../../src/types/shopping';

function makeLine(overrides: Partial<ShoppingLine>): ShoppingLine {
  return {
    key: 'ingredient:x:g',
    label: 'Item',
    categoryId: 'produce',
    quantity: null,
    sources: [],
    purchased: false,
    ...overrides,
  };
}

function makeGroup(categoryId: string, lines: readonly ShoppingLine[]): ShoppingListGroup {
  return { categoryId, categoryName: categoryId, lines };
}

describe('BR-22 purchased lines on screen', () => {
  it('keeps unpurchased lines in their aisle and in their order', () => {
    const layout = layoutShoppingList([
      makeGroup('produce', [
        makeLine({ key: 'onion', label: 'Onion' }),
        makeLine({ key: 'tomato', label: 'Tomato', purchased: true }),
        makeLine({ key: 'zucchini', label: 'Zucchini' }),
      ]),
    ]);

    expect(layout.aisles).toEqual([
      makeGroup('produce', [
        makeLine({ key: 'onion', label: 'Onion' }),
        makeLine({ key: 'zucchini', label: 'Zucchini' }),
      ]),
    ]);
  });

  it('moves purchased lines out of their aisle into one list after every aisle', () => {
    const tomato = makeLine({ key: 'tomato', label: 'Tomato', purchased: true });

    const layout = layoutShoppingList([
      makeGroup('produce', [makeLine({ key: 'onion', label: 'Onion' }), tomato]),
    ]);

    expect(layout.aisles.flatMap((group) => group.lines)).not.toContain(tomato);
    expect(layout.purchased).toEqual([tomato]);
  });

  it('orders purchased lines by aisle, then as they were inside the aisle', () => {
    const layout = layoutShoppingList([
      makeGroup('produce', [
        makeLine({ key: 'apple', label: 'Apple', purchased: true }),
        makeLine({ key: 'onion', label: 'Onion' }),
        makeLine({ key: 'tomato', label: 'Tomato', purchased: true }),
      ]),
      makeGroup('dairy', [makeLine({ key: 'butter', label: 'Butter', purchased: true })]),
    ]);

    expect(layout.purchased.map((line) => line.key)).toEqual(['apple', 'tomato', 'butter']);
  });

  it('omits an aisle whose lines are all purchased', () => {
    const layout = layoutShoppingList([
      makeGroup('produce', [makeLine({ key: 'tomato', label: 'Tomato', purchased: true })]),
      makeGroup('dairy', [makeLine({ key: 'butter', label: 'Butter' })]),
    ]);

    expect(layout.aisles.map((group) => group.categoryId)).toEqual(['dairy']);
  });

  it('returns an empty layout when there is nothing to buy', () => {
    expect(layoutShoppingList([])).toEqual({ aisles: [], purchased: [] });
  });
});
