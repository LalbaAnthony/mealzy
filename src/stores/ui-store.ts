import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { SnackbarMessage, SnackbarTone } from '../types/ui';
import type { DomainError } from '../types/validation';

const SNACKBAR_LIFETIME_MS = 5000;

export const useUiStore = defineStore('ui', () => {
  const messages = ref<SnackbarMessage[]>([]);
  let counter = 0;

  function dismiss(id: string): void {
    messages.value = messages.value.filter((message) => message.id !== id);
  }

  function notify(text: string, tone: SnackbarTone): void {
    counter += 1;
    const id = `snackbar-${String(counter)}`;
    messages.value = [...messages.value, { id, text, tone }];
    setTimeout(() => {
      dismiss(id);
    }, SNACKBAR_LIFETIME_MS);
  }

  function notifySuccess(text: string): void {
    notify(text, 'neutral');
  }

  function notifyError(error: DomainError): void {
    const detail = error.details.length > 0 ? ` ${error.details.join(', ')}` : '';
    notify(`${error.message}${detail}`, 'error');
  }

  function notifyFailure(text: string): void {
    notify(text, 'error');
  }

  return { messages, notifySuccess, notifyError, notifyFailure, dismiss };
});
