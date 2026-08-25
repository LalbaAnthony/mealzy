<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import type { Recipe } from '../types/recipe';
import { useConfirmDialog } from '../composables/useConfirmDialog';
import { useCatalogueStore } from '../stores/catalogue-store';
import { useRecipesStore } from '../stores/recipes-store';
import ConfirmDialog from '../components/app/ConfirmDialog.vue';
import EmptyState from '../components/app/EmptyState.vue';
import MdFab from '../components/md/MdFab.vue';
import MdIconButton from '../components/md/MdIconButton.vue';
import MdList from '../components/md/MdList.vue';
import MdListItem from '../components/md/MdListItem.vue';

const router = useRouter();
const recipes = useRecipesStore();
const catalogue = useCatalogueStore();
const confirmDialog = useConfirmDialog();

function describeIngredients(recipe: Recipe): string {
  if (recipe.ingredients.length === 0) {
    return 'No ingredients yet';
  }
  return recipe.ingredients
    .map((recipeIngredient) => catalogue.ingredientName(recipeIngredient.ingredientId))
    .join(', ');
}

async function openEditor(id: string): Promise<void> {
  await router.push(`/recipes/${id}`);
}

async function createRecipe(): Promise<void> {
  await router.push('/recipes/new');
}

async function requestDelete(recipe: Recipe): Promise<void> {
  const confirmed = await confirmDialog.confirm(
    {
      title: `Delete ${recipe.name}?`,
      body: 'The recipe will be removed permanently. Meals already eaten keep their name.',
      confirmLabel: 'Delete',
      cancelLabel: 'Keep',
      destructive: true,
    },
    [],
  );
  if (confirmed) {
    await recipes.remove(recipe.id);
  }
}

onMounted(async () => {
  await Promise.all([recipes.load(), catalogue.load()]);
});
</script>

<template>
  <div class="recipes-view">
    <MdList v-if="recipes.sortedRecipes.length > 0" label="Recipes">
      <MdListItem
        v-for="recipe in recipes.sortedRecipes"
        :key="recipe.id"
        :headline="recipe.name"
        :supporting-text="describeIngredients(recipe)"
        lines="two"
      >
        <template #trailing>
          <MdIconButton icon="edit" :label="`Edit ${recipe.name}`" @click="openEditor(recipe.id)" />
          <MdIconButton
            icon="delete"
            :label="`Delete ${recipe.name}`"
            @click="requestDelete(recipe)"
          />
        </template>
      </MdListItem>
    </MdList>

    <EmptyState
      v-else
      icon="menu_book"
      title="No recipes yet"
      body="A recipe is a reusable template. Add one, then plan meals from it."
    />

    <MdFab class="recipes-view__fab" icon="add" label="New recipe" extended @click="createRecipe" />

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
.recipes-view {
  display: flex;
  flex-direction: column;
  gap: var(--md-sys-spacing-4);
  padding-block-end: calc(var(--md-sys-size-fab) + var(--md-sys-spacing-8));
}

.recipes-view__fab {
  position: fixed;
  inset-block-end: var(--md-sys-inset-floating-bottom);
  inset-inline-end: var(--md-sys-spacing-4);
  z-index: var(--md-sys-z-index-fab);
}
</style>
