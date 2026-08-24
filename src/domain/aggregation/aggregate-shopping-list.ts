import type { IngredientId } from '../../types/identifiers';
import type { Ingredient } from '../../types/ingredient';
import type {
  AdHocItem,
  ShoppingContribution,
  ShoppingLine,
  ShoppingLineAccumulator,
  ShoppingLineSource,
  ShoppingListAggregationInput,
} from '../../types/shopping';
import type { Quantity, QuantityBucket } from '../../types/units';
import { normaliseQuantity } from '../units/measurement';
import { shoppingLineKeyForAdHocItem, shoppingLineKeyForIngredient } from './shopping-line-key';

function buildContribution(
  ingredientId: IngredientId,
  quantity: Quantity | null,
  source: ShoppingLineSource,
): ShoppingContribution {
  if (quantity === null) {
    return { ingredientId, bucket: 'none', amount: 0, source };
  }
  const normalised = normaliseQuantity(quantity);
  return { ingredientId, bucket: normalised.unit, amount: normalised.amount, source };
}

function collectContributions(
  input: ShoppingListAggregationInput,
): readonly ShoppingContribution[] {
  const recipesById = new Map(input.recipes.map((recipe) => [recipe.id, recipe]));
  const contributions: ShoppingContribution[] = [];

  for (const meal of input.plannedMeals) {
    if (meal.status !== 'planned') {
      continue;
    }
    const recipe = recipesById.get(meal.recipeId);
    if (recipe === undefined) {
      continue;
    }
    for (const recipeIngredient of recipe.ingredients) {
      contributions.push(
        buildContribution(recipeIngredient.ingredientId, recipeIngredient.quantity, {
          kind: 'meal',
          mealPlannedId: meal.id,
        }),
      );
    }
  }

  for (const staple of input.staples) {
    if (!staple.enabled) {
      continue;
    }
    contributions.push(
      buildContribution(staple.ingredientId, staple.defaultQuantity, {
        kind: 'staple',
        stapleId: staple.id,
      }),
    );
  }

  return contributions;
}

function quantityForBucket(bucket: QuantityBucket, amount: number): Quantity | null {
  return bucket === 'none' ? null : { amount, unit: bucket };
}

function buildIngredientLines(
  contributions: readonly ShoppingContribution[],
  ingredientsById: ReadonlyMap<IngredientId, Ingredient>,
  purchasedKeys: ReadonlySet<string>,
): readonly ShoppingLine[] {
  const accumulators = new Map<string, ShoppingLineAccumulator>();

  for (const contribution of contributions) {
    const ingredient = ingredientsById.get(contribution.ingredientId);
    if (ingredient === undefined) {
      continue;
    }
    const key = shoppingLineKeyForIngredient(contribution.ingredientId, contribution.bucket);
    const existing = accumulators.get(key);
    if (existing === undefined) {
      accumulators.set(key, {
        key,
        ingredient,
        bucket: contribution.bucket,
        amount: contribution.amount,
        sources: [contribution.source],
      });
      continue;
    }
    existing.amount += contribution.amount;
    existing.sources.push(contribution.source);
  }

  return [...accumulators.values()].map((accumulator) => ({
    key: accumulator.key,
    label: accumulator.ingredient.name,
    categoryId: accumulator.ingredient.categoryId,
    quantity: quantityForBucket(accumulator.bucket, accumulator.amount),
    sources: accumulator.sources,
    purchased: purchasedKeys.has(accumulator.key),
  }));
}

function buildAdHocLine(item: AdHocItem, purchasedKeys: ReadonlySet<string>): ShoppingLine {
  const key = shoppingLineKeyForAdHocItem(item.id);
  return {
    key,
    label: item.label,
    categoryId: item.categoryId,
    quantity: item.quantity,
    sources: [{ kind: 'adhoc', adHocItemId: item.id }],
    purchased: purchasedKeys.has(key),
  };
}

export function aggregateShoppingList(
  input: ShoppingListAggregationInput,
): readonly ShoppingLine[] {
  const ingredientsById = new Map(
    input.ingredients.map((ingredient) => [ingredient.id, ingredient]),
  );
  const purchasedKeys = new Set(input.purchasedKeys);
  const contributions = collectContributions(input);
  const ingredientLines = buildIngredientLines(contributions, ingredientsById, purchasedKeys);
  const adHocLines = input.adHocItems.map((item) => buildAdHocLine(item, purchasedKeys));
  return [...ingredientLines, ...adHocLines];
}
