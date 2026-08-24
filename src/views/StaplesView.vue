<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import type { Staple } from '../types/shopping';
import type { RecipeIngredientRowState } from '../types/ui';
import type { Unit } from '../types/units';
import { formatOptionalQuantity } from '../domain/units/format';
import { useConfirmDialog } from '../composables/useConfirmDialog';
import { useUnitOptions } from '../composables/useUnitOptions';
import { useCatalogueStore } from '../stores/catalogue-store';
import { useStaplesStore } from '../stores/staples-store';
import ConfirmDialog from '../components/app/ConfirmDialog.vue';
import EmptyState from '../components/app/EmptyState.vue';
import MdButton from '../components/md/MdButton.vue';
import MdDialog from '../components/md/MdDialog.vue';
import MdFab from '../components/md/MdFab.vue';
import MdIconButton from '../components/md/MdIconButton.vue';
import MdList from '../components/md/MdList.vue';
import MdListItem from '../components/md/MdListItem.vue';
import MdSelect from '../components/md/MdSelect.vue';
import MdSwitch from '../components/md/MdSwitch.vue';
import MdTextField from '../components/md/MdTextField.vue';

const staples = useStaplesStore();
const catalogue = useCatalogueStore();
const confirmDialog = useConfirmDialog();
const { unitOptions } = useUnitOptions();

const dialogOpen = ref(false);
const editingId = ref<string | null>(null);
const form = ref<RecipeIngredientRowState>({ ingredientId: '', amount: '', unit: 'g' });

const hasIngredients = computed(() => catalogue.ingredientOptions.length > 0);
const dialogTitle = computed(() => (editingId.value === null ? 'Add a staple' : 'Edit staple'));

function toUnit(value: string): Unit {
  const match = unitOptions.find((option) => option.value === value);
  return match === undefined ? 'g' : match.value;
}

function describeStaple(staple: Staple): string {
  const quantity = formatOptionalQuantity(staple.defaultQuantity);
  const parts = [quantity === '' ? 'Any amount' : quantity];
  if (!staple.enabled) {
    parts.push('paused');
  }
  return parts.join(' - ');
}

function openCreateDialog(): void {
  editingId.value = null;
  form.value = {
    ingredientId: catalogue.ingredientOptions[0]?.value ?? '',
    amount: '',
    unit: 'g',
  };
  dialogOpen.value = true;
}

function openEditDialog(staple: Staple): void {
  editingId.value = staple.id;
  form.value = {
    ingredientId: staple.ingredientId,
    amount: staple.defaultQuantity === null ? '' : String(staple.defaultQuantity.amount),
    unit: staple.defaultQuantity === null ? 'g' : staple.defaultQuantity.unit,
  };
  dialogOpen.value = true;
}

function buildDraft(enabled: boolean) {
  const amount = Number.parseFloat(form.value.amount);
  return {
    ingredientId: form.value.ingredientId,
    defaultQuantity:
      form.value.amount.trim() === '' || Number.isNaN(amount)
        ? null
        : { amount, unit: form.value.unit },
    enabled,
  };
}

async function submit(): Promise<void> {
  const id = editingId.value;
  if (id === null) {
    if (await staples.create(buildDraft(true))) {
      dialogOpen.value = false;
    }
    return;
  }

  const existing = staples.staples.find((staple) => staple.id === id);
  if (await staples.update(id, buildDraft(existing?.enabled ?? true))) {
    dialogOpen.value = false;
  }
}

async function setEnabled(staple: Staple, enabled: boolean): Promise<void> {
  await staples.update(staple.id, {
    ingredientId: staple.ingredientId,
    defaultQuantity: staple.defaultQuantity,
    enabled,
  });
}

async function requestDelete(staple: Staple): Promise<void> {
  const name = catalogue.ingredientName(staple.ingredientId);
  const confirmed = await confirmDialog.confirm(
    {
      title: `Remove ${name} from staples?`,
      body: 'It stops appearing on every shopping list. The ingredient itself is kept.',
      confirmLabel: 'Remove',
      cancelLabel: 'Keep',
      destructive: true,
    },
    [],
  );
  if (confirmed) {
    await staples.remove(staple.id);
  }
}

onMounted(async () => {
  await catalogue.load();
  await staples.load();
});
</script>

<template>
  <div class="staples-view">
    <p class="staples-view__intro">
      Staples are always on the shopping list, even when no meal needs them. Pause one to keep it
      without buying it.
    </p>

    <MdList v-if="staples.sortedStaples.length > 0" label="Staples">
      <MdListItem
        v-for="staple in staples.sortedStaples"
        :key="staple.id"
        :headline="catalogue.ingredientName(staple.ingredientId)"
        :supporting-text="describeStaple(staple)"
        lines="two"
      >
        <template #trailing>
          <MdSwitch
            :model-value="staple.enabled"
            @update:model-value="setEnabled(staple, $event)"
          />
          <MdIconButton icon="edit" label="Edit staple" @click="openEditDialog(staple)" />
          <MdIconButton icon="delete" label="Remove staple" @click="requestDelete(staple)" />
        </template>
      </MdListItem>
    </MdList>

    <EmptyState
      v-else
      icon="inventory_2"
      title="No staples"
      body="Add the things you always keep in stock, such as salt or flour."
    />

    <MdFab
      class="staples-view__fab"
      icon="add"
      label="Add staple"
      extended
      @click="openCreateDialog"
    />

    <MdDialog :open="dialogOpen" :title="dialogTitle" @close="dialogOpen = false">
      <MdSelect
        v-if="hasIngredients"
        v-model="form.ingredientId"
        label="Ingredient"
        :options="catalogue.ingredientOptions"
      />
      <p v-else>Add an ingredient from the Pantry tab first.</p>
      <MdTextField
        v-model="form.amount"
        label="Default amount"
        type="number"
        min="0"
        step="any"
        supporting-text="Leave empty for an unspecified amount"
      />
      <MdSelect
        :model-value="form.unit"
        label="Unit"
        :options="unitOptions"
        @update:model-value="form.unit = toUnit($event)"
      />
      <template #actions>
        <MdButton variant="text" @click="dialogOpen = false">Cancel</MdButton>
        <MdButton :disabled="!hasIngredients" @click="submit">Save</MdButton>
      </template>
    </MdDialog>

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
.staples-view {
  display: flex;
  flex-direction: column;
  gap: var(--md-sys-spacing-4);
  padding-block-end: var(--md-sys-spacing-16);
}

.staples-view__intro {
  font-size: var(--md-sys-typescale-body-medium-size);
  line-height: var(--md-sys-typescale-body-medium-line-height);
  color: var(--md-sys-color-on-surface-variant);
}

.staples-view__fab {
  position: fixed;
  inset-block-end: var(--md-sys-spacing-22);
  inset-inline-end: var(--md-sys-spacing-4);
}
</style>
