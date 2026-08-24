import { describe, expect, it } from 'vitest';
import { buildShoppingListText } from '../../../src/domain/export/shopping-list-text';
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

function makeGroup(overrides: Partial<ShoppingListGroup>): ShoppingListGroup {
  return { categoryId: 'produce', categoryName: 'Produce', lines: [], ...overrides };
}

describe('BR-19 shopping list export', () => {
  it('renders groups in upper case with one dash line per item', () => {
    const text = buildShoppingListText({
      generatedOn: '2026-08-24',
      groups: [
        makeGroup({
          categoryId: 'produce',
          categoryName: 'Produce',
          lines: [
            makeLine({ key: 'a', label: 'Onion', quantity: { amount: 3, unit: 'piece' } }),
            makeLine({ key: 'b', label: 'Tomato', quantity: { amount: 500, unit: 'g' } }),
          ],
        }),
        makeGroup({
          categoryId: 'dairy',
          categoryName: 'Dairy',
          lines: [makeLine({ key: 'c', label: 'Butter', quantity: { amount: 250, unit: 'g' } })],
        }),
        makeGroup({
          categoryId: 'uncategorized',
          categoryName: 'Uncategorized',
          lines: [makeLine({ key: 'd', label: 'Salt', quantity: null })],
        }),
      ],
    });

    expect(text).toBe(
      [
        'Shopping list - 2026-08-24',
        '',
        'PRODUCE',
        '- Onion 3 piece',
        '- Tomato 500 g',
        '',
        'DAIRY',
        '- Butter 250 g',
        '',
        'UNCATEGORIZED',
        '- Salt',
      ].join('\n'),
    );
  });

  it('excludes purchased lines', () => {
    const text = buildShoppingListText({
      generatedOn: '2026-08-24',
      groups: [
        makeGroup({
          lines: [
            makeLine({ key: 'a', label: 'Onion', purchased: true }),
            makeLine({ key: 'b', label: 'Tomato' }),
          ],
        }),
      ],
    });

    expect(text).toContain('- Tomato');
    expect(text).not.toContain('Onion');
  });

  it('omits a group whose lines are all purchased', () => {
    const text = buildShoppingListText({
      generatedOn: '2026-08-24',
      groups: [
        makeGroup({
          categoryName: 'Produce',
          lines: [makeLine({ key: 'a', label: 'Onion', purchased: true })],
        }),
        makeGroup({
          categoryId: 'dairy',
          categoryName: 'Dairy',
          lines: [makeLine({ key: 'b', label: 'Butter' })],
        }),
      ],
    });

    expect(text).not.toContain('PRODUCE');
    expect(text).toContain('DAIRY');
  });

  it('applies display normalisation to exported quantities', () => {
    const text = buildShoppingListText({
      generatedOn: '2026-08-24',
      groups: [
        makeGroup({
          lines: [makeLine({ key: 'a', label: 'Flour', quantity: { amount: 1200, unit: 'g' } })],
        }),
      ],
    });

    expect(text).toContain('- Flour 1.2 kg');
  });

  it('returns the header alone when nothing is left to buy', () => {
    expect(buildShoppingListText({ generatedOn: '2026-08-24', groups: [] })).toBe(
      'Shopping list - 2026-08-24',
    );
  });
});
