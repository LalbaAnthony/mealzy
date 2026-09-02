import { beforeEach, describe, expect, it } from 'vitest';
import { createTestHarness, seedCatalogue, seededIngredientId } from '../../support/test-harness';

let harness: ReturnType<typeof createTestHarness>;
let produceId: string;

async function buildSampleState(): Promise<void> {
  const tomatoId = await seededIngredientId(harness, 'Tomato');
  const recipe = await harness.services.recipes.create({
    name: 'Soup',
    notes: 'warm',
    instructions: '',
    ingredients: [{ ingredientId: tomatoId, quantity: { amount: 500, unit: 'g' } }],
  });
  if (!recipe.ok) {
    throw new Error('recipe creation failed');
  }
  await harness.services.meals.plan(recipe.value.id, {
    scheduledDate: '2026-09-01',
    slot: 'dinner',
  });
  await harness.services.adHocItems.create({
    label: 'Light bulbs',
    quantity: { amount: 2, unit: 'piece' },
    categoryId: produceId,
  });
  await harness.services.shoppingList.setPurchased(`ingredient:${tomatoId}:g`, true);
  await harness.services.settings.setThemePreference('dark');
}

beforeEach(async () => {
  harness = createTestHarness();
  const { produce } = await seedCatalogue(harness);
  produceId = produce.id;
});

describe('full data backup', () => {
  it('exports a document carrying the schema version and every collection', async () => {
    await buildSampleState();

    const { json } = await harness.services.backup.exportDocument();
    const parsed: unknown = JSON.parse(json);

    expect(parsed).toMatchObject({
      schemaVersion: 1,
      exportedAt: 1000,
      preferences: { themePreference: 'dark' },
    });
    expect(json).toContain('"categories"');
    expect(json).toContain('"ingredients"');
    expect(json).toContain('"recipes"');
    expect(json).toContain('"mealsPlanned"');
    expect(json).toContain('"staples"');
    expect(json).toContain('"adHocItems"');
    expect(json).toContain('"purchasedKeys"');
  });

  it('names the downloaded file after the moment of the export', async () => {
    harness.advanceTo(new Date(2026, 7, 25, 14, 30, 5).getTime());

    const { fileName } = await harness.services.backup.exportDocument();

    expect(fileName).toBe('mealzy-backup-2026-08-25-143005.json');
  });

  it('restores an identical state after a wipe', async () => {
    await buildSampleState();
    const { json } = await harness.services.backup.exportDocument();
    const before = await harness.services.shoppingList.getSnapshot();

    const wiped = createTestHarness();
    const result = await wiped.services.backup.importDocument(json);

    expect(result).toMatchObject({ ok: true });
    const after = await wiped.services.shoppingList.getSnapshot();
    expect(after.lines).toEqual(before.lines);
    expect(after.groups).toEqual(before.groups);
    expect(await wiped.services.settings.getPreferences()).toEqual({ themePreference: 'dark' });
  });

  it('replaces the entire dataset rather than merging it', async () => {
    await buildSampleState();
    const { json } = await harness.services.backup.exportDocument();

    const other = createTestHarness();
    await seedCatalogue(other);
    await other.services.recipes.create({
      name: 'Doomed',
      notes: '',
      instructions: '',
      ingredients: [],
    });

    await other.services.backup.importDocument(json);

    const recipes = await other.services.recipes.list();
    expect(recipes.map((recipe) => recipe.name)).toEqual(['Soup']);
  });

  it('rejects a document that is not json without touching the data', async () => {
    await buildSampleState();
    const before = await harness.services.recipes.list();

    const result = await harness.services.backup.importDocument('not json at all');

    expect(result).toMatchObject({ ok: false, error: { code: 'backup-invalid' } });
    if (!result.ok) {
      expect(result.error.message).toContain('not valid JSON');
    }
    expect(await harness.services.recipes.list()).toEqual(before);
  });

  it('rejects a structurally invalid document with actionable details', async () => {
    await buildSampleState();
    const before = await harness.services.recipes.list();

    const result = await harness.services.backup.importDocument(
      JSON.stringify({ schemaVersion: 1, exportedAt: 1, categories: 'not an array' }),
    );

    expect(result).toMatchObject({ ok: false, error: { code: 'backup-invalid' } });
    if (!result.ok) {
      expect(result.error.details.length).toBeGreaterThan(0);
      expect(result.error.details.join(' ')).toContain('categories');
    }
    expect(await harness.services.recipes.list()).toEqual(before);
  });

  it('rejects a document whose records break the entity rules', async () => {
    const result = await harness.services.backup.importDocument(
      JSON.stringify({
        schemaVersion: 1,
        exportedAt: 1,
        categories: [{ id: '', name: '', sortOrder: 1 }],
        ingredients: [],
        recipes: [],
        mealsPlanned: [],
        staples: [],
        adHocItems: [],
        purchasedKeys: [],
        preferences: { themePreference: 'system' },
      }),
    );

    expect(result).toMatchObject({ ok: false, error: { code: 'backup-invalid' } });
  });
});

describe('settings service', () => {
  it('reads and writes the theme preference', async () => {
    expect(await harness.services.settings.getPreferences()).toEqual({
      themePreference: 'system',
    });

    const updated = await harness.services.settings.setThemePreference('light');

    expect(updated).toEqual({ themePreference: 'light' });
    expect(await harness.services.settings.getPreferences()).toEqual({
      themePreference: 'light',
    });
  });

  it('surfaces the storage status', async () => {
    expect(await harness.services.settings.getStorageStatus()).toEqual({
      persistence: 'persisted',
      usageBytes: 1024,
      quotaBytes: 4096,
    });
    expect(await harness.services.settings.requestPersistence()).toBe('persisted');
  });
});
