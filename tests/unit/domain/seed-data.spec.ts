import { describe, expect, it } from 'vitest';
import { buildSeedData } from '../../../src/domain/seed/seed-data';
import { makeSequentialIdGenerator } from '../../support/factories';

describe('BR-14 seed data', () => {
  const seed = buildSeedData({ generateId: makeSequentialIdGenerator('seed'), now: 1000 });

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

  it('creates the staple ingredients under Grocery', () => {
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

  it('creates one enabled staple per seeded ingredient', () => {
    expect(seed.staples).toHaveLength(seed.ingredients.length);
    expect(seed.staples.every((staple) => staple.enabled)).toBe(true);
    expect(seed.staples.every((staple) => staple.defaultQuantity === null)).toBe(true);
    expect(seed.staples.map((staple) => staple.ingredientId)).toEqual(
      seed.ingredients.map((ingredient) => ingredient.id),
    );
  });

  it('generates unique identifiers', () => {
    const ids = [
      ...seed.categories.map((category) => category.id),
      ...seed.ingredients.map((ingredient) => ingredient.id),
      ...seed.staples.map((staple) => staple.id),
    ];

    expect(new Set(ids).size).toBe(ids.length);
  });
});
