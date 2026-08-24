import type { AdHocItemId, IngredientId, ShoppingLineKey } from '../../types/identifiers';
import type { QuantityBucket } from '../../types/units';

export function shoppingLineKeyForIngredient(
  ingredientId: IngredientId,
  bucket: QuantityBucket,
): ShoppingLineKey {
  return `ingredient:${ingredientId}:${bucket}`;
}

export function shoppingLineKeyForAdHocItem(adHocItemId: AdHocItemId): ShoppingLineKey {
  return `adhoc:${adHocItemId}`;
}
