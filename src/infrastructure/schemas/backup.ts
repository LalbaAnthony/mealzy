import { z } from 'zod';
import type { BackupDocument } from '../../types/backup';
import type { BackupCodec } from '../../types/ports';
import type { DomainResult } from '../../types/validation';
import type { IsExactly } from '../../types/type-assertions';
import { assertSchemaMatchesDeclaredType } from './assert-types';
import {
  adHocItemSchema,
  appPreferencesSchema,
  categorySchema,
  ingredientSchema,
  mealPlannedSchema,
  purchasedKeysSchema,
  recipeSchema,
  stapleSchema,
} from './entities';

export const backupDocumentSchema = z
  .object({
    schemaVersion: z.number().int().positive(),
    exportedAt: z.number().int(),
    categories: z.array(categorySchema).readonly(),
    ingredients: z.array(ingredientSchema).readonly(),
    recipes: z.array(recipeSchema).readonly(),
    mealsPlanned: z.array(mealPlannedSchema).readonly(),
    staples: z.array(stapleSchema).readonly(),
    adHocItems: z.array(adHocItemSchema).readonly(),
    purchasedKeys: purchasedKeysSchema,
    preferences: appPreferencesSchema,
  })
  .readonly();

assertSchemaMatchesDeclaredType<IsExactly<z.output<typeof backupDocumentSchema>, BackupDocument>>(
  true,
);

function describeIssues(issues: readonly { path: PropertyKey[]; message: string }[]): string[] {
  return issues.map((issue) => {
    const path = issue.path.map((segment) => String(segment)).join('.');
    return path.length === 0 ? issue.message : `${path}: ${issue.message}`;
  });
}

export function createBackupCodec(): BackupCodec {
  return {
    serialise(document: BackupDocument): string {
      return `${JSON.stringify(document, null, 2)}\n`;
    },

    parse(rawJson: string): DomainResult<BackupDocument> {
      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(rawJson);
      } catch {
        return {
          ok: false,
          error: {
            code: 'backup-invalid',
            message: 'That file is not valid JSON, so nothing was imported.',
            details: [],
          },
        };
      }

      const result = backupDocumentSchema.safeParse(parsedJson);
      if (!result.success) {
        return {
          ok: false,
          error: {
            code: 'backup-invalid',
            message:
              'That backup file does not match the expected format, so nothing was imported.',
            details: describeIssues(result.error.issues),
          },
        };
      }

      return { ok: true, value: result.data };
    },
  };
}
