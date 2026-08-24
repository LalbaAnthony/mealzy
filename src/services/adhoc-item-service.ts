import type { AdHocItemId } from '../types/identifiers';
import type { AdHocItemDraft, AdHocItemService, ServiceDependencies } from '../types/services';
import type { AdHocItem } from '../types/shopping';
import type { DomainResult } from '../types/validation';
import { validateAdHocItemDraft } from '../domain/validation/adhoc';
import { fail, ok } from '../domain/validation/result';

export function createAdHocItemService(dependencies: ServiceDependencies): AdHocItemService {
  const { adHocItems, categories } = dependencies.repositories;

  return {
    list(): Promise<readonly AdHocItem[]> {
      return adHocItems.getAll();
    },

    async create(draft: AdHocItemDraft): Promise<DomainResult<AdHocItem>> {
      const validation = validateAdHocItemDraft({ draft, categories: await categories.getAll() });
      if (!validation.ok) {
        return validation;
      }

      const item: AdHocItem = {
        id: dependencies.ids.next(),
        label: validation.value.label,
        quantity: validation.value.quantity,
        categoryId: validation.value.categoryId,
        createdAt: dependencies.clock.now(),
      };
      await adHocItems.put(item);
      return ok(item);
    },

    async update(id: AdHocItemId, draft: AdHocItemDraft): Promise<DomainResult<AdHocItem>> {
      const existing = await adHocItems.getById(id);
      if (existing === null) {
        return fail('entity-not-found', 'That ad hoc item no longer exists.', [id]);
      }

      const validation = validateAdHocItemDraft({ draft, categories: await categories.getAll() });
      if (!validation.ok) {
        return validation;
      }

      const updated: AdHocItem = {
        ...existing,
        label: validation.value.label,
        quantity: validation.value.quantity,
        categoryId: validation.value.categoryId,
      };
      await adHocItems.put(updated);
      return ok(updated);
    },

    async remove(id: AdHocItemId): Promise<DomainResult<void>> {
      const existing = await adHocItems.getById(id);
      if (existing === null) {
        return fail('entity-not-found', 'That ad hoc item no longer exists.', [id]);
      }
      await adHocItems.remove(id);
      return ok(undefined);
    },
  };
}
