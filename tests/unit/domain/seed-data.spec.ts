import { describe, expect, it } from 'vitest';
import type { SeedCatalogue } from '../../../src/types/seed';
import { SEED_CATALOGUE } from '../../../src/domain/seed/seed-catalogue';
import { buildSeedData } from '../../../src/domain/seed/seed-data';
import { makeSequentialIdGenerator } from '../../support/factories';

function build(catalogue: SeedCatalogue) {
  return buildSeedData({
    catalogue,
    generateId: makeSequentialIdGenerator('seed'),
    now: 1000,
  });
}

describe('BR-14 seed data', () => {
  const seed = build(SEED_CATALOGUE);

  it('creates the reserved uncategorized category', () => {
    const uncategorized = seed.categories.find((category) => category.id === 'uncategorized');

    expect(uncategorized).toEqual({
      id: 'uncategorized',
      name: 'Uncategorized',
      sortOrder: 1000,
    });
  });

  it('creates the six named shopping aisles in order', () => {
    expect(
      seed.categories
        .filter((category) => category.id !== 'uncategorized')
        .map((category) => category.name),
    ).toEqual(['Produce', 'Dairy', 'Meat and fish', 'Grocery', 'Frozen', 'Household']);
  });

  it('carries the sort order declared in the category catalogue', () => {
    expect(
      seed.categories
        .filter((category) => category.id !== 'uncategorized')
        .map((category) => category.sortOrder),
    ).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('creates the catalogue ingredients under Grocery', () => {
    const grocery = seed.categories.find((category) => category.name === 'Grocery');

    expect(seed.ingredients.map((ingredient) => ingredient.name)).toEqual([
      'Coffee',
      'Sugar',
      'Olive oil',
      'Parchment paper',
      'Grated cheese',
      'Salt',
      'Sunflower oil',
      'Pepper',
      'Butter',
      'Flour',
      'Milk',
      'Honey',
      'Eggs',
      'Pet food',
      'Balsamic vinegar',
    ]);
    expect(seed.ingredients.every((ingredient) => ingredient.categoryId === grocery?.id)).toBe(
      true,
    );
  });

  it('stamps the seed timestamp on every ingredient', () => {
    expect(seed.ingredients.every((ingredient) => ingredient.createdAt === 1000)).toBe(true);
    expect(seed.ingredients.every((ingredient) => ingredient.updatedAt === 1000)).toBe(true);
  });

  it('generates unique identifiers', () => {
    const ids = [
      ...seed.categories.map((category) => category.id),
      ...seed.ingredients.map((ingredient) => ingredient.id),
    ];

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('resolves each ingredient against the category key it declares', () => {
    const result = build({
      categories: [
        { key: 'produce', name: 'Produce', sortOrder: 1 },
        { key: 'frozen', name: 'Frozen', sortOrder: 2 },
      ],
      ingredients: [
        { name: 'Leek', categoryKey: 'produce' },
        { name: 'Peas', categoryKey: 'frozen' },
      ],
    });
    const frozen = result.categories.find((category) => category.name === 'Frozen');
    const peas = result.ingredients.find((ingredient) => ingredient.name === 'Peas');

    expect(peas?.categoryId).toBe(frozen?.id);
  });

  it('rejects a catalogue whose ingredient names an unknown category key', () => {
    expect(() =>
      build({
        categories: [{ key: 'grocery', name: 'Grocery', sortOrder: 1 }],
        ingredients: [{ name: 'Leek', categoryKey: 'produce' }],
      }),
    ).toThrow('The seed ingredient "Leek" refers to the unknown category key "produce".');
  });

  it('rejects a catalogue that declares the same category key twice', () => {
    expect(() =>
      build({
        categories: [
          { key: 'grocery', name: 'Grocery', sortOrder: 1 },
          { key: 'grocery', name: 'Store cupboard', sortOrder: 2 },
        ],
        ingredients: [],
      }),
    ).toThrow('The seed catalogue declares the category key "grocery" twice.');
  });
});
