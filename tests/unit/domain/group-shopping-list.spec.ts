import { describe, expect, it } from 'vitest';
import { groupShoppingList } from '../../../src/domain/aggregation/group-shopping-list';
import type { ShoppingLine } from '../../../src/types/shopping';
import { makeCategory } from '../../support/factories';

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

const produce = makeCategory({ id: 'produce', name: 'Produce', sortOrder: 1 });
const dairy = makeCategory({ id: 'dairy', name: 'Dairy', sortOrder: 2 });
const uncategorized = makeCategory({
  id: 'uncategorized',
  name: 'Uncategorized',
  sortOrder: 1000,
});

describe('BR-18 shopping list grouping', () => {
  it('groups lines by category and orders groups by sort order', () => {
    const groups = groupShoppingList({
      categories: [dairy, produce],
      lines: [
        makeLine({ key: 'a', label: 'Butter', categoryId: 'dairy' }),
        makeLine({ key: 'b', label: 'Tomato', categoryId: 'produce' }),
      ],
    });

    expect(groups.map((group) => group.categoryName)).toEqual(['Produce', 'Dairy']);
  });

  it('orders lines alphabetically by label inside a group', () => {
    const groups = groupShoppingList({
      categories: [produce],
      lines: [
        makeLine({ key: 'a', label: 'Tomato' }),
        makeLine({ key: 'b', label: 'Onion' }),
        makeLine({ key: 'c', label: 'apple' }),
      ],
    });

    expect(groups[0]?.lines.map((line) => line.label)).toEqual(['apple', 'Onion', 'Tomato']);
  });

  it('keeps lines that share a label adjacent and ordered by key', () => {
    const groups = groupShoppingList({
      categories: [produce],
      lines: [
        makeLine({ key: 'ingredient:tomato:none', label: 'Tomato' }),
        makeLine({ key: 'ingredient:onion:piece', label: 'Onion' }),
        makeLine({ key: 'ingredient:tomato:g', label: 'Tomato' }),
      ],
    });

    expect(groups[0]?.lines.map((line) => line.key)).toEqual([
      'ingredient:onion:piece',
      'ingredient:tomato:g',
      'ingredient:tomato:none',
    ]);
  });

  it('always places uncategorized last even with a low sort order', () => {
    const groups = groupShoppingList({
      categories: [
        makeCategory({ id: 'uncategorized', name: 'Uncategorized', sortOrder: 0 }),
        produce,
      ],
      lines: [
        makeLine({ key: 'a', label: 'Salt', categoryId: 'uncategorized' }),
        makeLine({ key: 'b', label: 'Tomato', categoryId: 'produce' }),
      ],
    });

    expect(groups.map((group) => group.categoryId)).toEqual(['produce', 'uncategorized']);
  });

  it('falls back to the uncategorized category for unknown category ids', () => {
    const groups = groupShoppingList({
      categories: [produce, uncategorized],
      lines: [makeLine({ key: 'a', label: 'Mystery', categoryId: 'ghost' })],
    });

    expect(groups).toHaveLength(1);
    expect(groups[0]?.categoryId).toBe('uncategorized');
    expect(groups[0]?.categoryName).toBe('Uncategorized');
  });

  it('synthesises the uncategorized group when the category is absent', () => {
    const groups = groupShoppingList({
      categories: [produce],
      lines: [makeLine({ key: 'a', label: 'Mystery', categoryId: 'ghost' })],
    });

    expect(groups[0]?.categoryId).toBe('uncategorized');
    expect(groups[0]?.categoryName).toBe('Uncategorized');
  });

  it('breaks sort order ties by category name', () => {
    const groups = groupShoppingList({
      categories: [
        makeCategory({ id: 'zeta', name: 'Zeta', sortOrder: 5 }),
        makeCategory({ id: 'alpha', name: 'Alpha', sortOrder: 5 }),
      ],
      lines: [
        makeLine({ key: 'a', label: 'One', categoryId: 'zeta' }),
        makeLine({ key: 'b', label: 'Two', categoryId: 'alpha' }),
      ],
    });

    expect(groups.map((group) => group.categoryName)).toEqual(['Alpha', 'Zeta']);
  });

  it('returns nothing when there are no lines', () => {
    expect(groupShoppingList({ categories: [produce], lines: [] })).toEqual([]);
  });
});
