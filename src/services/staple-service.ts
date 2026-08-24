import type { StapleId } from '../types/identifiers';
import type { ServiceDependencies, StapleDraft, StapleService } from '../types/services';
import type { Staple } from '../types/shopping';
import type { DomainResult } from '../types/validation';
import { validateStapleDraft } from '../domain/validation/staple';
import { fail, ok } from '../domain/validation/result';

export function createStapleService(dependencies: ServiceDependencies): StapleService {
  const { staples, ingredients } = dependencies.repositories;

  return {
    list(): Promise<readonly Staple[]> {
      return staples.getAll();
    },

    async create(draft: StapleDraft): Promise<DomainResult<Staple>> {
      const validation = validateStapleDraft({
        draft,
        existingStaples: await staples.getAll(),
        ingredients: await ingredients.getAll(),
        stapleIdInEdit: null,
      });
      if (!validation.ok) {
        return validation;
      }

      const staple: Staple = {
        id: dependencies.ids.next(),
        ingredientId: validation.value.ingredientId,
        defaultQuantity: validation.value.defaultQuantity,
        enabled: validation.value.enabled,
      };
      await staples.put(staple);
      return ok(staple);
    },

    async update(id: StapleId, draft: StapleDraft): Promise<DomainResult<Staple>> {
      const existing = await staples.getById(id);
      if (existing === null) {
        return fail('entity-not-found', 'That staple no longer exists.', [id]);
      }

      const validation = validateStapleDraft({
        draft,
        existingStaples: await staples.getAll(),
        ingredients: await ingredients.getAll(),
        stapleIdInEdit: id,
      });
      if (!validation.ok) {
        return validation;
      }

      const updated: Staple = {
        ...existing,
        ingredientId: validation.value.ingredientId,
        defaultQuantity: validation.value.defaultQuantity,
        enabled: validation.value.enabled,
      };
      await staples.put(updated);
      return ok(updated);
    },

    async remove(id: StapleId): Promise<DomainResult<void>> {
      const existing = await staples.getById(id);
      if (existing === null) {
        return fail('entity-not-found', 'That staple no longer exists.', [id]);
      }
      await staples.remove(id);
      return ok(undefined);
    },
  };
}
