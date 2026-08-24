import type { ComputedRef, Ref } from 'vue';
import type { ConfirmDialogRequest, UnitOption, ViewportClass } from './ui';

export interface ViewportApi {
  readonly viewportClass: Ref<ViewportClass>;
}

export interface ConfirmDialogApi {
  readonly isOpen: Ref<boolean>;
  readonly request: Ref<ConfirmDialogRequest>;
  readonly details: Ref<string[]>;
  readonly confirm: (
    next: ConfirmDialogRequest,
    extraDetails: readonly string[],
  ) => Promise<boolean>;
  readonly accept: () => void;
  readonly cancel: () => void;
}

export interface ShoppingListExportApi {
  readonly canCopy: ComputedRef<boolean>;
  readonly canShare: ComputedRef<boolean>;
  readonly copyToClipboard: () => Promise<void>;
  readonly downloadAsText: () => Promise<void>;
  readonly share: () => Promise<void>;
}

export interface PwaUpdateApi {
  readonly needRefresh: Ref<boolean>;
  readonly offlineReady: Ref<boolean>;
  readonly applyUpdate: () => Promise<void>;
  readonly dismissUpdate: () => void;
  readonly dismissOfflineReady: () => void;
}

export interface UnitOptionsApi {
  readonly unitOptions: readonly UnitOption[];
}
