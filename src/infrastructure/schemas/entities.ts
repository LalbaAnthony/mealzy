import { z } from 'zod';
import type { Category, Ingredient } from '../../types/ingredient';
import type { MealPlanned } from '../../types/meal';
import type { Recipe, RecipeIngredient } from '../../types/recipe';
import type { AdHocItem, Staple } from '../../types/shopping';
import type { AppPreferences } from '../../types/settings';
import type { Quantity } from '../../types/units';
import type { IsExactly } from '../../types/type-assertions';
import { assertSchemaMatchesDeclaredType } from './assert-types';

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

export const unitSchema = z.enum(['g', 'kg', 'ml', 'l', 'tsp', 'tbsp', 'piece']);

export const quantitySchema = z
  .object({
    amount: z.number().positive(),
    unit: unitSchema,
  })
  .readonly();

export const categorySchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    sortOrder: z.number().int(),
  })
  .readonly();

export const ingredientSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    categoryId: z.string().min(1),
    createdAt: z.number().int(),
    updatedAt: z.number().int(),
  })
  .readonly();

export const recipeIngredientSchema = z
  .object({
    ingredientId: z.string().min(1),
    quantity: quantitySchema.nullable(),
  })
  .readonly();

export const recipeSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    notes: z.string(),
    ingredients: z.array(recipeIngredientSchema).readonly(),
    createdAt: z.number().int(),
    updatedAt: z.number().int(),
  })
  .readonly();

export const mealPlannedSchema = z
  .object({
    id: z.string().min(1),
    recipeId: z.string().min(1),
    recipeNameSnapshot: z.string(),
    scheduledDate: z.string().regex(isoDatePattern).nullable(),
    slot: z.enum(['lunch', 'dinner']).nullable(),
    manualOrder: z.number().int(),
    status: z.enum(['planned', 'eaten']),
    eatenAt: z.number().int().nullable(),
    createdAt: z.number().int(),
    updatedAt: z.number().int(),
  })
  .readonly();

export const stapleSchema = z
  .object({
    id: z.string().min(1),
    ingredientId: z.string().min(1),
    defaultQuantity: quantitySchema.nullable(),
    enabled: z.boolean(),
  })
  .readonly();

export const adHocItemSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1),
    quantity: quantitySchema.nullable(),
    categoryId: z.string().min(1),
    createdAt: z.number().int(),
  })
  .readonly();

export const appPreferencesSchema = z
  .object({
    themePreference: z.enum(['system', 'light', 'dark']),
  })
  .readonly();

export const purchasedKeysSchema = z.array(z.string().min(1)).readonly();

assertSchemaMatchesDeclaredType<IsExactly<z.output<typeof quantitySchema>, Quantity>>(true);
assertSchemaMatchesDeclaredType<IsExactly<z.output<typeof categorySchema>, Category>>(true);
assertSchemaMatchesDeclaredType<IsExactly<z.output<typeof ingredientSchema>, Ingredient>>(true);
assertSchemaMatchesDeclaredType<
  IsExactly<z.output<typeof recipeIngredientSchema>, RecipeIngredient>
>(true);
assertSchemaMatchesDeclaredType<IsExactly<z.output<typeof recipeSchema>, Recipe>>(true);
assertSchemaMatchesDeclaredType<IsExactly<z.output<typeof mealPlannedSchema>, MealPlanned>>(true);
assertSchemaMatchesDeclaredType<IsExactly<z.output<typeof stapleSchema>, Staple>>(true);
assertSchemaMatchesDeclaredType<IsExactly<z.output<typeof adHocItemSchema>, AdHocItem>>(true);
assertSchemaMatchesDeclaredType<IsExactly<z.output<typeof appPreferencesSchema>, AppPreferences>>(
  true,
);
