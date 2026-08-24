import { computed } from 'vue';
import type { ShoppingListExportApi } from '../types/composables';
import { useServices } from '../app/container';
import { useShoppingStore } from '../stores/shopping-store';
import { useUiStore } from '../stores/ui-store';

const EXPORT_FILE_NAME = 'shopping-list.txt';
const EXPORT_MIME_TYPE = 'text/plain;charset=utf-8';

export function useShoppingListExport(): ShoppingListExportApi {
  const services = useServices();
  const shopping = useShoppingStore();
  const ui = useUiStore();

  const canCopy = computed(() => services.platform.clipboard.isSupported());
  const canShare = computed(() => services.platform.share.isSupported());

  async function copyToClipboard(): Promise<void> {
    const text = await shopping.buildExportText();
    try {
      await services.platform.clipboard.write(text);
      ui.notifySuccess('Shopping list copied to the clipboard.');
    } catch {
      ui.notifyFailure('The clipboard is not available. Download the list instead.');
    }
  }

  async function downloadAsText(): Promise<void> {
    const text = await shopping.buildExportText();
    services.platform.download.download(EXPORT_FILE_NAME, text, EXPORT_MIME_TYPE);
  }

  async function share(): Promise<void> {
    const text = await shopping.buildExportText();
    try {
      await services.platform.share.share({ title: 'Shopping list', text });
    } catch {
      ui.notifyFailure('Sharing was cancelled or is not available.');
    }
  }

  return { canCopy, canShare, copyToClipboard, downloadAsText, share };
}
