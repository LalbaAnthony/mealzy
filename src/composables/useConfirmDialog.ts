import { ref } from 'vue';
import type { ConfirmDialogRequest } from '../types/ui';
import type { ConfirmDialogApi } from '../types/composables';

const CLOSED_REQUEST: ConfirmDialogRequest = {
  title: '',
  body: '',
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  destructive: false,
};

export function useConfirmDialog(): ConfirmDialogApi {
  const isOpen = ref(false);
  const request = ref<ConfirmDialogRequest>(CLOSED_REQUEST);
  const details = ref<string[]>([]);
  let resolveCurrent: ((confirmed: boolean) => void) | null = null;

  function confirm(next: ConfirmDialogRequest, extraDetails: readonly string[]): Promise<boolean> {
    request.value = next;
    details.value = [...extraDetails];
    isOpen.value = true;
    return new Promise<boolean>((resolve) => {
      resolveCurrent = resolve;
    });
  }

  function settle(confirmed: boolean): void {
    isOpen.value = false;
    const resolve = resolveCurrent;
    resolveCurrent = null;
    resolve?.(confirmed);
  }

  function accept(): void {
    settle(true);
  }

  function cancel(): void {
    settle(false);
  }

  return { isOpen, request, details, confirm, accept, cancel };
}
