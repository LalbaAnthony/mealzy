<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import type { SegmentedOption } from '../types/ui';
import type { StoragePersistenceState, ThemePreference } from '../types/settings';
import { useServices } from '../app/container';
import { useConfirmDialog } from '../composables/useConfirmDialog';
import { useSettingsStore } from '../stores/settings-store';
import { useUiStore } from '../stores/ui-store';
import ConfirmDialog from '../components/app/ConfirmDialog.vue';
import DeleteAllDataDialog from '../components/app/DeleteAllDataDialog.vue';
import MdButton from '../components/md/MdButton.vue';
import MdCard from '../components/md/MdCard.vue';
import MdSegmentedButton from '../components/md/MdSegmentedButton.vue';

const settings = useSettingsStore();
const ui = useUiStore();
const confirmDialog = useConfirmDialog();

const fileInput = ref<HTMLInputElement | null>(null);
const eraseDialogOpen = ref(false);
const backupExported = ref(false);

const themeOptions: readonly SegmentedOption[] = [
  { value: 'system', label: 'System', icon: 'brightness_auto' },
  { value: 'light', label: 'Light', icon: 'light_mode' },
  { value: 'dark', label: 'Dark', icon: 'dark_mode' },
];

const PERSISTENCE_LABELS: Record<StoragePersistenceState, string> = {
  persisted: 'Granted. The browser will not evict your data automatically.',
  'not-persisted': 'Not granted. The browser may evict your data when storage runs low.',
  unsupported: 'This browser does not support persistent storage.',
  unknown: 'The browser did not report a persistence state.',
};

const appVersion = import.meta.env.VITE_APP_VERSION;

const persistenceLabel = computed(() => PERSISTENCE_LABELS[settings.storageStatus.persistence]);

const usageLabel = computed(() => {
  const { usageBytes, quotaBytes } = settings.storageStatus;
  if (usageBytes === null || quotaBytes === null) {
    return 'Usage is not reported by this browser.';
  }
  const usedMb = (usageBytes / 1024 / 1024).toFixed(2);
  const quotaMb = (quotaBytes / 1024 / 1024).toFixed(0);
  return `Using ${usedMb} MB of about ${quotaMb} MB.`;
});

async function onThemeChange(value: string): Promise<void> {
  if (value === 'system' || value === 'light' || value === 'dark') {
    await settings.setThemePreference(value satisfies ThemePreference);
  }
}

async function exportBackup(): Promise<void> {
  const services = useServices();
  const backup = await services.backup.exportDocument();
  services.platform.download.download(backup.fileName, backup.json, 'application/json');
  backupExported.value = true;
  ui.notifySuccess('Backup downloaded.');
}

function openEraseDialog(): void {
  backupExported.value = false;
  eraseDialogOpen.value = true;
}

async function eraseAllData(): Promise<void> {
  eraseDialogOpen.value = false;
  await settings.eraseAllData();
  ui.notifySuccess('All local data deleted. Reopen the other tabs to refresh them.');
}

function pickBackupFile(): void {
  fileInput.value?.click();
}

async function onFileChosen(event: Event): Promise<void> {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) {
    return;
  }
  const file = target.files?.item(0) ?? null;
  target.value = '';
  if (file === null) {
    return;
  }

  const contents = await file.text();
  const confirmed = await confirmDialog.confirm(
    {
      title: 'Replace all data?',
      body: `Importing ${file.name} destroys every recipe, meal, ingredient and staple currently stored in this browser. This cannot be undone.`,
      confirmLabel: 'Replace everything',
      cancelLabel: 'Cancel',
      destructive: true,
    },
    [],
  );
  if (!confirmed) {
    return;
  }

  const result = await useServices().backup.importDocument(contents);
  if (!result.ok) {
    ui.notifyError(result.error);
    return;
  }
  await settings.load();
  ui.notifySuccess('Backup restored. Reopen the other tabs to see the imported data.');
}

onMounted(async () => {
  await settings.load();
});
</script>

<template>
  <div class="settings-view">
    <MdCard variant="outlined">
      <h2 class="settings-view__title">Appearance</h2>
      <p class="settings-view__body">
        System follows your device setting. A manual choice is remembered on this device.
      </p>
      <MdSegmentedButton
        :model-value="settings.preferences.themePreference"
        :options="themeOptions"
        label="Theme"
        @update:model-value="onThemeChange"
      />
    </MdCard>

    <MdCard variant="outlined">
      <h2 class="settings-view__title">Storage</h2>
      <p class="settings-view__body">
        All data lives in this browser only. Nothing is sent anywhere.
      </p>
      <p class="settings-view__body">{{ persistenceLabel }}</p>
      <p class="settings-view__body">{{ usageLabel }}</p>
      <MdButton variant="tonal" icon="storage" @click="settings.requestPersistence">
        Request persistent storage
      </MdButton>
    </MdCard>

    <MdCard variant="outlined">
      <h2 class="settings-view__title">Backup</h2>
      <p class="settings-view__body">
        Export writes a single JSON file holding every recipe, meal, ingredient, staple and tick.
        Import replaces everything currently stored.
      </p>
      <div class="settings-view__buttons">
        <MdButton variant="tonal" icon="download" @click="exportBackup">Export backup</MdButton>
        <MdButton variant="outlined" icon="upload_file" @click="pickBackupFile">
          Import backup
        </MdButton>
      </div>
      <input
        ref="fileInput"
        class="visually-hidden"
        type="file"
        accept="application/json,.json"
        @change="onFileChosen"
      />
    </MdCard>

    <MdCard variant="outlined">
      <h2 class="settings-view__title">About</h2>
      <p class="settings-view__body">Version {{ appVersion }}</p>
    </MdCard>

    <MdCard variant="outlined" class="settings-view__danger">
      <h2 class="settings-view__title settings-view__title--danger">Delete all local data</h2>
      <p class="settings-view__body">
        Removes every recipe, meal, ingredient, staple, ad hoc item and purchased tick from this
        browser, then puts Mealzy back to its first-run state with the default categories and
        staples. It cannot be undone, and a backup is the only way back.
      </p>
      <p class="settings-view__body">
        Currently stored: {{ settings.dataSummary.recipes }} recipes,
        {{ settings.dataSummary.plannedMeals }} planned meals,
        {{ settings.dataSummary.ingredients }} ingredients.
      </p>
      <MdButton variant="outlined" icon="delete_forever" @click="openEraseDialog">
        Delete all local data
      </MdButton>
    </MdCard>

    <DeleteAllDataDialog
      :open="eraseDialogOpen"
      :summary="settings.dataSummary"
      :backup-exported="backupExported"
      @export-backup="exportBackup"
      @confirm="eraseAllData"
      @cancel="eraseDialogOpen = false"
    />

    <ConfirmDialog
      :open="confirmDialog.isOpen.value"
      :title="confirmDialog.request.value.title"
      :body="confirmDialog.request.value.body"
      :confirm-label="confirmDialog.request.value.confirmLabel"
      :cancel-label="confirmDialog.request.value.cancelLabel"
      :destructive="confirmDialog.request.value.destructive"
      @confirm="confirmDialog.accept"
      @cancel="confirmDialog.cancel"
    />
  </div>
</template>

<style scoped>
.settings-view {
  display: flex;
  flex-direction: column;
  gap: var(--md-sys-spacing-4);
  padding-block-end: var(--md-sys-spacing-8);
}

.settings-view__title {
  font-size: var(--md-sys-typescale-title-medium-size);
  line-height: var(--md-sys-typescale-title-medium-line-height);
  font-weight: var(--md-sys-typescale-weight-medium);
  padding-block-end: var(--md-sys-spacing-2);
}

.settings-view__body {
  font-size: var(--md-sys-typescale-body-medium-size);
  line-height: var(--md-sys-typescale-body-medium-line-height);
  color: var(--md-sys-color-on-surface-variant);
  padding-block-end: var(--md-sys-spacing-2);
}

.settings-view__danger {
  border-color: var(--md-sys-color-error);
}

.settings-view__title--danger {
  color: var(--md-sys-color-error);
}

.settings-view__buttons {
  display: flex;
  flex-wrap: wrap;
  gap: var(--md-sys-spacing-2);
}
</style>
