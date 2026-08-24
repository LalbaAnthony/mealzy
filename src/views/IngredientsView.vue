<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import type { Category, Ingredient } from '../types/ingredient';
import { UNCATEGORIZED_CATEGORY_ID } from '../domain/constants';
import { useConfirmDialog } from '../composables/useConfirmDialog';
import { useCatalogueStore } from '../stores/catalogue-store';
import ConfirmDialog from '../components/app/ConfirmDialog.vue';
import EmptyState from '../components/app/EmptyState.vue';
import MdButton from '../components/md/MdButton.vue';
import MdDialog from '../components/md/MdDialog.vue';
import MdIconButton from '../components/md/MdIconButton.vue';
import MdList from '../components/md/MdList.vue';
import MdListItem from '../components/md/MdListItem.vue';
import MdSelect from '../components/md/MdSelect.vue';
import MdTextField from '../components/md/MdTextField.vue';

const catalogue = useCatalogueStore();
const confirmDialog = useConfirmDialog();

const ingredientDialogOpen = ref(false);
const categoryDialogOpen = ref(false);
const editingIngredientId = ref<string | null>(null);
const editingCategoryId = ref<string | null>(null);
const ingredientName = ref('');
const ingredientCategoryId = ref('');
const categoryName = ref('');

const ingredientDialogTitle = computed(() =>
  editingIngredientId.value === null ? 'Add an ingredient' : 'Edit ingredient',
);
const categoryDialogTitle = computed(() =>
  editingCategoryId.value === null ? 'Add an aisle' : 'Rename aisle',
);

function isReserved(category: Category): boolean {
  return category.id === UNCATEGORIZED_CATEGORY_ID;
}

function openIngredientDialog(ingredient: Ingredient | null): void {
  editingIngredientId.value = ingredient?.id ?? null;
  ingredientName.value = ingredient?.name ?? '';
  ingredientCategoryId.value =
    ingredient?.categoryId ?? catalogue.categoryOptions[0]?.value ?? UNCATEGORIZED_CATEGORY_ID;
  ingredientDialogOpen.value = true;
}

async function submitIngredient(): Promise<void> {
  const draft = { name: ingredientName.value, categoryId: ingredientCategoryId.value };
  const id = editingIngredientId.value;
  const saved =
    id === null
      ? await catalogue.createIngredient(draft)
      : await catalogue.updateIngredient(id, draft);
  if (saved) {
    ingredientDialogOpen.value = false;
  }
}

function openCategoryDialog(category: Category | null): void {
  editingCategoryId.value = category?.id ?? null;
  categoryName.value = category?.name ?? '';
  categoryDialogOpen.value = true;
}

async function submitCategory(): Promise<void> {
  const id = editingCategoryId.value;
  const saved =
    id === null
      ? await catalogue.createCategory(categoryName.value)
      : await catalogue.renameCategory(id, categoryName.value);
  if (saved) {
    categoryDialogOpen.value = false;
  }
}

async function requestIngredientDelete(ingredient: Ingredient): Promise<void> {
  const confirmed = await confirmDialog.confirm(
    {
      title: `Delete ${ingredient.name}?`,
      body: 'Deleting is blocked while a recipe or a staple still references it.',
      confirmLabel: 'Delete',
      cancelLabel: 'Keep',
      destructive: true,
    },
    [],
  );
  if (confirmed) {
    await catalogue.removeIngredient(ingredient.id);
  }
}

async function requestCategoryDelete(category: Category): Promise<void> {
  const confirmed = await confirmDialog.confirm(
    {
      title: `Delete ${category.name}?`,
      body: 'Deleting is blocked while an ingredient or a one-off item still uses this aisle.',
      confirmLabel: 'Delete',
      cancelLabel: 'Keep',
      destructive: true,
    },
    [],
  );
  if (confirmed) {
    await catalogue.removeCategory(category.id);
  }
}

onMounted(async () => {
  await catalogue.load();
});
</script>

<template>
  <div class="pantry-view">
    <section class="pantry-view__section">
      <div class="pantry-view__header">
        <h2 class="pantry-view__title">Ingredients</h2>
        <MdButton variant="tonal" icon="add" @click="openIngredientDialog(null)">Add</MdButton>
      </div>

      <MdList v-if="catalogue.sortedIngredients.length > 0" label="Ingredients">
        <MdListItem
          v-for="ingredient in catalogue.sortedIngredients"
          :key="ingredient.id"
          :headline="ingredient.name"
          :supporting-text="catalogue.categoryName(ingredient.categoryId)"
          lines="two"
        >
          <template #trailing>
            <MdIconButton
              icon="edit"
              :label="`Edit ${ingredient.name}`"
              @click="openIngredientDialog(ingredient)"
            />
            <MdIconButton
              icon="delete"
              :label="`Delete ${ingredient.name}`"
              @click="requestIngredientDelete(ingredient)"
            />
          </template>
        </MdListItem>
      </MdList>

      <EmptyState
        v-else
        icon="kitchen"
        title="No ingredients"
        body="Ingredients are shared across recipes so quantities can be added up reliably."
      />
    </section>

    <section class="pantry-view__section">
      <div class="pantry-view__header">
        <h2 class="pantry-view__title">Aisles</h2>
        <MdButton variant="tonal" icon="add" @click="openCategoryDialog(null)">Add</MdButton>
      </div>

      <MdList label="Aisles">
        <MdListItem
          v-for="category in catalogue.sortedCategories"
          :key="category.id"
          :headline="category.name"
          :supporting-text="isReserved(category) ? 'Reserved, always last' : ''"
          lines="two"
        >
          <template #trailing>
            <MdIconButton
              icon="edit"
              :label="`Rename ${category.name}`"
              :disabled="isReserved(category)"
              @click="openCategoryDialog(category)"
            />
            <MdIconButton
              icon="delete"
              :label="`Delete ${category.name}`"
              :disabled="isReserved(category)"
              @click="requestCategoryDelete(category)"
            />
          </template>
        </MdListItem>
      </MdList>
    </section>

    <MdDialog
      :open="ingredientDialogOpen"
      :title="ingredientDialogTitle"
      @close="ingredientDialogOpen = false"
    >
      <MdTextField v-model="ingredientName" label="Name" required />
      <MdSelect v-model="ingredientCategoryId" label="Aisle" :options="catalogue.categoryOptions" />
      <template #actions>
        <MdButton variant="text" @click="ingredientDialogOpen = false">Cancel</MdButton>
        <MdButton @click="submitIngredient">Save</MdButton>
      </template>
    </MdDialog>

    <MdDialog
      :open="categoryDialogOpen"
      :title="categoryDialogTitle"
      @close="categoryDialogOpen = false"
    >
      <MdTextField v-model="categoryName" label="Aisle name" required />
      <template #actions>
        <MdButton variant="text" @click="categoryDialogOpen = false">Cancel</MdButton>
        <MdButton @click="submitCategory">Save</MdButton>
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
.pantry-view {
  display: flex;
  flex-direction: column;
  gap: var(--md-sys-spacing-8);
  padding-block-end: var(--md-sys-spacing-8);
}

.pantry-view__section {
  display: flex;
  flex-direction: column;
  gap: var(--md-sys-spacing-3);
}

.pantry-view__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--md-sys-spacing-3);
}

.pantry-view__title {
  font-size: var(--md-sys-typescale-title-medium-size);
  line-height: var(--md-sys-typescale-title-medium-line-height);
  font-weight: var(--md-sys-typescale-weight-medium);
}
</style>
