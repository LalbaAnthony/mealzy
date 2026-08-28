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

  it('creates every shopping aisle the catalogue declares, in order', () => {
    expect(
      seed.categories
        .filter((category) => category.id !== 'uncategorized')
        .map((category) => category.name),
    ).toEqual(SEED_CATALOGUE.categories.map((category) => category.name));
  });

  it('carries the sort order declared in the category catalogue', () => {
    expect(
      seed.categories
        .filter((category) => category.id !== 'uncategorized')
        .map((category) => category.sortOrder),
    ).toEqual(SEED_CATALOGUE.categories.map((category) => category.sortOrder));
  });

  it('creates every catalogue ingredient under the aisle its key names', () => {
    const categoryIdByKey = new Map(
      SEED_CATALOGUE.categories.map((category) => [
        category.key,
        seed.categories.find((built) => built.name === category.name)?.id,
      ]),
    );

    expect(seed.ingredients.map((ingredient) => ingredient.name)).toEqual(
      SEED_CATALOGUE.ingredients.map((ingredient) => ingredient.name),
    );
    expect(seed.ingredients.map((ingredient) => ingredient.categoryId)).toEqual(
      SEED_CATALOGUE.ingredients.map((ingredient) => categoryIdByKey.get(ingredient.categoryKey)),
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
