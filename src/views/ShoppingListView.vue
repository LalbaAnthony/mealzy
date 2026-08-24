<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import type { ShoppingLine, ShoppingLineSource } from '../types/shopping';
import { useConfirmDialog } from '../composables/useConfirmDialog';
import { useShoppingListExport } from '../composables/useShoppingListExport';
import { useCatalogueStore } from '../stores/catalogue-store';
import { useMealsStore } from '../stores/meals-store';
import { useShoppingStore } from '../stores/shopping-store';
import ConfirmDialog from '../components/app/ConfirmDialog.vue';
import EmptyState from '../components/app/EmptyState.vue';
import ShoppingLineItem from '../components/app/ShoppingLineItem.vue';
import MdButton from '../components/md/MdButton.vue';
import MdCard from '../components/md/MdCard.vue';
import MdDialog from '../components/md/MdDialog.vue';
import MdList from '../components/md/MdList.vue';
import MdSelect from '../components/md/MdSelect.vue';
import MdTextField from '../components/md/MdTextField.vue';

const shopping = useShoppingStore();
const meals = useMealsStore();
const catalogue = useCatalogueStore();
const confirmDialog = useConfirmDialog();
const exporting = useShoppingListExport();

const adHocDialogOpen = ref(false);
const adHocLabel = ref('');
const adHocAmount = ref('');
const adHocCategoryId = ref('');

const summary = computed(
  () => `${String(shopping.remainingCount)} left of ${String(shopping.snapshot.totalCount)} items`,
);

function describeSource(source: ShoppingLineSource): string {
  if (source.kind === 'staple') {
    return 'Staple';
  }
  if (source.kind === 'adhoc') {
    return 'One-off item';
  }
  const meal = meals.meals.find((candidate) => candidate.id === source.mealPlannedId);
  if (meal === undefined) {
    return 'Planned meal';
  }
  return meal.scheduledDate === null
    ? meal.recipeNameSnapshot
    : `${meal.recipeNameSnapshot} (${meal.scheduledDate})`;
}

function sourceLabels(line: ShoppingLine): string[] {
  return line.sources.map(describeSource);
}

function openAdHocDialog(): void {
  adHocLabel.value = '';
  adHocAmount.value = '';
  adHocCategoryId.value = catalogue.categoryOptions[0]?.value ?? '';
  adHocDialogOpen.value = true;
}

async function submitAdHoc(): Promise<void> {
  const amount = Number.parseFloat(adHocAmount.value);
  const added = await shopping.addAdHocItem({
    label: adHocLabel.value,
    quantity:
      adHocAmount.value.trim() === '' || Number.isNaN(amount) ? null : { amount, unit: 'piece' },
    categoryId: adHocCategoryId.value,
  });
  if (added) {
    adHocDialogOpen.value = false;
  }
}

async function requestResetTrip(): Promise<void> {
  const confirmed = await confirmDialog.confirm(
    {
      title: 'Reset the shopping trip?',
      body: 'Every tick is cleared and ticked one-off items are deleted permanently. Recipes, meals and staples are untouched.',
      confirmLabel: 'Reset trip',
      cancelLabel: 'Cancel',
      destructive: true,
    },
    [],
  );
  if (confirmed) {
    await shopping.resetTrip();
  }
}

onMounted(async () => {
  await Promise.all([shopping.load(), meals.load(), catalogue.load()]);
});
</script>

<template>
  <div class="shopping-view">
    <MdCard variant="outlined">
      <div class="shopping-view__actions">
        <p class="shopping-view__summary">{{ summary }}</p>
        <div class="shopping-view__buttons">
          <MdButton
            v-if="exporting.canCopy.value"
            variant="tonal"
            icon="content_copy"
            @click="exporting.copyToClipboard"
          >
            Copy
          </MdButton>
          <MdButton variant="tonal" icon="download" @click="exporting.downloadAsText">
            Download
          </MdButton>
          <MdButton
            v-if="exporting.canShare.value"
            variant="tonal"
            icon="upload_file"
            @click="exporting.share"
          >
            Share
          </MdButton>
          <MdButton variant="text" icon="restart_alt" @click="requestResetTrip">
            Reset trip
          </MdButton>
        </div>
      </div>
    </MdCard>

    <template v-if="!shopping.isEmpty">
      <section v-for="group in shopping.snapshot.groups" :key="group.categoryId">
        <h2 class="shopping-view__group-title">{{ group.categoryName }}</h2>
        <MdList :label="group.categoryName">
          <ShoppingLineItem
            v-for="line in group.lines"
            :key="line.key"
            :line="line"
            :source-labels="sourceLabels(line)"
            @toggle-purchased="shopping.setPurchased(line.key, $event)"
          />
        </MdList>
      </section>
    </template>

    <EmptyState
      v-else
      icon="shopping_cart"
      title="Nothing to buy"
      body="Plan a meal, enable a staple, or add a one-off item to build the list."
    />

    <MdButton
      class="shopping-view__add"
      variant="outlined"
      icon="add"
      full-width
      @click="openAdHocDialog"
    >
      Add a one-off item
    </MdButton>

    <MdDialog :open="adHocDialogOpen" title="Add a one-off item" @close="adHocDialogOpen = false">
      <MdTextField v-model="adHocLabel" label="Item" placeholder="Toilet paper" required />
      <MdTextField
        v-model="adHocAmount"
        label="How many"
        type="number"
        min="0"
        step="any"
        supporting-text="Leave empty for an unspecified amount"
      />
      <MdSelect v-model="adHocCategoryId" label="Aisle" :options="catalogue.categoryOptions" />
      <template #actions>
        <MdButton variant="text" @click="adHocDialogOpen = false">Cancel</MdButton>
        <MdButton @click="submitAdHoc">Add</MdButton>
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
.shopping-view {
  display: flex;
  flex-direction: column;
  gap: var(--md-sys-spacing-4);
  padding-block-end: var(--md-sys-spacing-8);
}

.shopping-view__actions {
  display: flex;
  flex-direction: column;
  gap: var(--md-sys-spacing-3);
}

.shopping-view__summary {
  font-size: var(--md-sys-typescale-title-medium-size);
  line-height: var(--md-sys-typescale-title-medium-line-height);
}

.shopping-view__buttons {
  display: flex;
  flex-wrap: wrap;
  gap: var(--md-sys-spacing-2);
}

.shopping-view__group-title {
  font-size: var(--md-sys-typescale-title-small-size);
  line-height: var(--md-sys-typescale-title-small-line-height);
  font-weight: var(--md-sys-typescale-weight-medium);
  color: var(--md-sys-color-primary);
  letter-spacing: var(--md-sys-typescale-tracking-wide);
  text-transform: uppercase;
  padding-block-end: var(--md-sys-spacing-2);
}
</style>
