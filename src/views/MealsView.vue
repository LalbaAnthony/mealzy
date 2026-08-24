<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import type { MealFilter, MealPlanned, MealSlot } from '../types/meal';
import type { MealMoveDirection } from '../types/ordering';
import type { SegmentedOption, SelectOption } from '../types/ui';
import { planMealMove } from '../domain/ordering/meal-order';
import { useConfirmDialog } from '../composables/useConfirmDialog';
import { useMealsStore } from '../stores/meals-store';
import { useRecipesStore } from '../stores/recipes-store';
import ConfirmDialog from '../components/app/ConfirmDialog.vue';
import EmptyState from '../components/app/EmptyState.vue';
import MealListItem from '../components/app/MealListItem.vue';
import MdButton from '../components/md/MdButton.vue';
import MdDialog from '../components/md/MdDialog.vue';
import MdFab from '../components/md/MdFab.vue';
import MdList from '../components/md/MdList.vue';
import MdSegmentedButton from '../components/md/MdSegmentedButton.vue';
import MdSelect from '../components/md/MdSelect.vue';
import MdTextField from '../components/md/MdTextField.vue';

const meals = useMealsStore();
const recipes = useRecipesStore();
const confirmDialog = useConfirmDialog();

const filterOptions: readonly SegmentedOption[] = [
  { value: 'planned', label: 'Planned', icon: null },
  { value: 'eaten', label: 'Eaten', icon: null },
  { value: 'all', label: 'All meal', icon: null },
];

const slotOptions: readonly SelectOption[] = [
  { value: '', label: 'No slot' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
];

const planDialogOpen = ref(false);
const editDialogOpen = ref(false);
const editingMealId = ref<string | null>(null);
const formRecipeId = ref('');
const formDate = ref('');
const formSlot = ref('');

const hasRecipes = computed(() => recipes.recipes.length > 0);

function toSlot(value: string): MealSlot | null {
  if (value === 'lunch' || value === 'dinner') {
    return value;
  }
  return null;
}

function canMove(meal: MealPlanned, direction: MealMoveDirection): boolean {
  return planMealMove(meals.meals, meal.id, direction).length > 0;
}

function onFilterChange(value: string): void {
  if (value === 'planned' || value === 'eaten' || value === 'all') {
    meals.setFilter(value satisfies MealFilter);
  }
}

function openPlanDialog(): void {
  formRecipeId.value = recipes.recipeOptions[0]?.value ?? '';
  formDate.value = '';
  formSlot.value = '';
  planDialogOpen.value = true;
}

async function submitPlan(): Promise<void> {
  const planned = await meals.plan(formRecipeId.value, {
    scheduledDate: formDate.value === '' ? null : formDate.value,
    slot: toSlot(formSlot.value),
  });
  if (planned) {
    planDialogOpen.value = false;
  }
}

function openEditDialog(meal: MealPlanned): void {
  editingMealId.value = meal.id;
  formDate.value = meal.scheduledDate ?? '';
  formSlot.value = meal.slot ?? '';
  editDialogOpen.value = true;
}

async function submitEdit(): Promise<void> {
  const id = editingMealId.value;
  if (id === null) {
    return;
  }
  const updated = await meals.update(id, {
    scheduledDate: formDate.value === '' ? null : formDate.value,
    slot: toSlot(formSlot.value),
  });
  if (updated) {
    editDialogOpen.value = false;
    editingMealId.value = null;
  }
}

async function toggleEaten(meal: MealPlanned): Promise<void> {
  if (meal.status === 'eaten') {
    await meals.markPlanned(meal.id);
    return;
  }
  await meals.markEaten(meal.id);
}

async function requestDelete(meal: MealPlanned): Promise<void> {
  const confirmed = await confirmDialog.confirm(
    {
      title: 'Delete this planned meal?',
      body: `${meal.recipeNameSnapshot} will be removed permanently. This cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Keep',
      destructive: true,
    },
    [],
  );
  if (confirmed) {
    await meals.remove(meal.id);
  }
}

onMounted(async () => {
  await Promise.all([meals.load(), recipes.load()]);
});
</script>

<template>
  <div class="meals-view">
    <div class="meals-view__toolbar">
      <MdSegmentedButton
        :model-value="meals.filter"
        :options="filterOptions"
        label="Filter planned meals"
        @update:model-value="onFilterChange"
      />
    </div>

    <MdList v-if="meals.visibleMeals.length > 0" label="Planned meals">
      <MealListItem
        v-for="meal in meals.visibleMeals"
        :key="meal.id"
        :meal="meal"
        :can-move-up="canMove(meal, 'up')"
        :can-move-down="canMove(meal, 'down')"
        @toggle-eaten="toggleEaten(meal)"
        @move-up="meals.moveUp(meal.id)"
        @move-down="meals.moveDown(meal.id)"
        @edit="openEditDialog(meal)"
        @remove="requestDelete(meal)"
      />
    </MdList>

    <EmptyState
      v-else
      icon="restaurant_menu"
      title="Nothing planned yet"
      :body="
        hasRecipes
          ? 'Plan a meal from one of your recipes to start building the shopping list.'
          : 'Create a recipe first, then plan a meal from it.'
      "
    />

    <MdFab
      class="meals-view__fab"
      icon="add"
      label="Plan a meal"
      extended
      @click="openPlanDialog"
    />

    <MdDialog :open="planDialogOpen" title="Plan a meal" @close="planDialogOpen = false">
      <MdSelect
        v-if="hasRecipes"
        v-model="formRecipeId"
        label="Recipe"
        :options="recipes.recipeOptions"
      />
      <p v-else>There are no recipes yet. Create one from the Recipes tab first.</p>
      <MdTextField v-model="formDate" label="Date" type="date" />
      <MdSelect v-model="formSlot" label="Slot" :options="slotOptions" />
      <template #actions>
        <MdButton variant="text" @click="planDialogOpen = false">Cancel</MdButton>
        <MdButton :disabled="!hasRecipes" @click="submitPlan">Plan</MdButton>
      </template>
    </MdDialog>

    <MdDialog :open="editDialogOpen" title="Edit schedule" @close="editDialogOpen = false">
      <MdTextField v-model="formDate" label="Date" type="date" />
      <MdSelect v-model="formSlot" label="Slot" :options="slotOptions" />
      <template #actions>
        <MdButton variant="text" @click="editDialogOpen = false">Cancel</MdButton>
        <MdButton @click="submitEdit">Save</MdButton>
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
.meals-view {
  display: flex;
  flex-direction: column;
  gap: var(--md-sys-spacing-4);
  padding-block-end: var(--md-sys-spacing-16);
}

.meals-view__toolbar {
  display: flex;
  justify-content: center;
}

.meals-view__fab {
  position: fixed;
  inset-block-end: var(--md-sys-spacing-16);
  inset-inline-end: var(--md-sys-spacing-4);
}
</style>
