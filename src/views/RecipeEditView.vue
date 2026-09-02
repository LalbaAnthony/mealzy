<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { RecipeIngredientDraft } from '../types/services';
import type { RecipeIngredientRowState } from '../types/ui';
import type { Unit } from '../types/units';
import { formatOptionalQuantity } from '../domain/units/format';
import { useIngredientQuickCreate } from '../composables/useIngredientQuickCreate';
import { useUnitOptions } from '../composables/useUnitOptions';
import { useCatalogueStore } from '../stores/catalogue-store';
import { useRecipesStore } from '../stores/recipes-store';
import { useUiStore } from '../stores/ui-store';
import EmptyState from '../components/app/EmptyState.vue';
import MdButton from '../components/md/MdButton.vue';
import MdCard from '../components/md/MdCard.vue';
import MdIconButton from '../components/md/MdIconButton.vue';
import MdSelect from '../components/md/MdSelect.vue';
import MdTextArea from '../components/md/MdTextArea.vue';
import MdTextField from '../components/md/MdTextField.vue';

const route = useRoute();
const router = useRouter();
const recipes = useRecipesStore();
const catalogue = useCatalogueStore();
const ui = useUiStore();
const { unitOptions } = useUnitOptions();
const ingredientQuickCreate = useIngredientQuickCreate();

const recipeId = computed(() => String(route.params.id));
const isNew = computed(() => recipeId.value === 'new');

const name = ref('');
const notes = ref('');
const instructions = ref('');
const rows = ref<RecipeIngredientRowState[]>([]);

const hasIngredients = computed(() => catalogue.ingredientOptions.length > 0);

function toUnit(value: string): Unit {
  const match = unitOptions.find((option) => option.value === value);
  return match === undefined ? 'g' : match.value;
}

function addRow(): void {
  const firstIngredient = catalogue.ingredientOptions[0];
  if (firstIngredient === undefined) {
    return;
  }
  rows.value = [...rows.value, { ingredientId: firstIngredient.value, amount: '', unit: 'g' }];
}

async function createIngredientForRow(
  row: RecipeIngredientRowState,
  searched: string,
): Promise<void> {
  const createdId = await ingredientQuickCreate.createFromSearch(searched);
  if (createdId !== null) {
    row.ingredientId = createdId;
  }
}

function removeRow(index: number): void {
  rows.value = rows.value.filter((_, rowIndex) => rowIndex !== index);
}

function buildDraftIngredients(): RecipeIngredientDraft[] {
  return rows.value.map((row) => {
    const amount = Number.parseFloat(row.amount);
    if (row.amount.trim() === '' || Number.isNaN(amount)) {
      return { ingredientId: row.ingredientId, quantity: null };
    }
    return { ingredientId: row.ingredientId, quantity: { amount, unit: row.unit } };
  });
}

function previewQuantity(index: number): string {
  const draft = buildDraftIngredients()[index];
  if (draft === undefined) {
    return '';
  }
  return formatOptionalQuantity(draft.quantity);
}

async function save(): Promise<void> {
  const draft = {
    name: name.value,
    notes: notes.value,
    instructions: instructions.value,
    ingredients: buildDraftIngredients(),
  };

  if (isNew.value) {
    const createdId = await recipes.create(draft);
    if (createdId !== null) {
      await router.push('/recipes');
    }
    return;
  }

  const updated = await recipes.update(recipeId.value, draft);
  if (updated) {
    await router.push('/recipes');
  }
}

async function cancel(): Promise<void> {
  await router.push('/recipes');
}

onMounted(async () => {
  await Promise.all([recipes.load(), catalogue.load()]);
  if (isNew.value) {
    return;
  }
  const existing = recipes.findById(recipeId.value);
  if (existing === null) {
    ui.notifyFailure('That recipe no longer exists.');
    await router.push('/recipes');
    return;
  }
  name.value = existing.name;
  notes.value = existing.notes;
  instructions.value = existing.instructions;
  rows.value = existing.ingredients.map((recipeIngredient) => ({
    ingredientId: recipeIngredient.ingredientId,
    amount: recipeIngredient.quantity === null ? '' : String(recipeIngredient.quantity.amount),
    unit: recipeIngredient.quantity === null ? 'g' : recipeIngredient.quantity.unit,
  }));
});
</script>

<template>
  <form class="recipe-edit" @submit.prevent="save">
    <MdTextField v-model="name" label="Recipe name" required />
    <MdTextArea v-model="notes" label="Notes" placeholder="Optional" :rows="3" />
    <MdTextArea v-model="instructions" label="Instructions" placeholder="Optional" :rows="6" />

    <section class="recipe-edit__ingredients">
      <h2 class="recipe-edit__heading">Ingredients</h2>

      <EmptyState
        v-if="!hasIngredients"
        icon="kitchen"
        title="No ingredients available"
        body="Add ingredients from the Pantry tab before building a recipe."
      />

      <MdCard v-for="(row, index) in rows" :key="index" variant="outlined">
        <div class="recipe-edit__row">
          <MdSelect
            v-model="row.ingredientId"
            label="Ingredient"
            :options="catalogue.ingredientOptions"
            allow-create
            @create="createIngredientForRow(row, $event)"
          />
          <MdTextField
            v-model="row.amount"
            label="Amount"
            type="number"
            min="0"
            step="any"
            placeholder="Any amount"
            :supporting-text="
              previewQuantity(index) === ''
                ? 'Leave empty for an unspecified amount'
                : previewQuantity(index)
            "
          />
          <MdSelect
            :model-value="row.unit"
            label="Unit"
            :options="unitOptions"
            @update:model-value="row.unit = toUnit($event)"
          />
          <MdIconButton icon="delete" label="Remove this ingredient" @click="removeRow(index)" />
        </div>
      </MdCard>

      <MdButton v-if="hasIngredients" variant="tonal" icon="add" type="button" @click="addRow">
        Add ingredient
      </MdButton>
    </section>

    <div class="recipe-edit__actions">
      <MdButton variant="text" type="button" @click="cancel">Cancel</MdButton>
      <MdButton type="submit">Save recipe</MdButton>
    </div>
  </form>
</template>

<style scoped>
.recipe-edit {
  display: flex;
  flex-direction: column;
  gap: var(--md-sys-spacing-4);
  padding-block-end: var(--md-sys-spacing-16);
}

.recipe-edit__ingredients {
  display: flex;
  flex-direction: column;
  gap: var(--md-sys-spacing-3);
}

.recipe-edit__heading {
  font-size: var(--md-sys-typescale-title-medium-size);
  line-height: var(--md-sys-typescale-title-medium-line-height);
  font-weight: var(--md-sys-typescale-weight-medium);
}

.recipe-edit__row {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--md-sys-spacing-3);
  align-items: end;
}

.recipe-edit__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--md-sys-spacing-2);
}

@media (min-width: 600px) {
  .recipe-edit__row {
    grid-template-columns: 2fr 1fr 1fr auto;
  }
}
</style>
