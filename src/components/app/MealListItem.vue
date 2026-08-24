<script setup lang="ts">
import { computed, ref } from 'vue';
import type { MealListItemProps } from '../../types/components';
import { formatIsoDateForDisplay } from '../../domain/date/iso-date';
import MdCheckbox from '../md/MdCheckbox.vue';
import MdIconButton from '../md/MdIconButton.vue';
import MdListItem from '../md/MdListItem.vue';
import MdMenu from '../md/MdMenu.vue';
import MdMenuItem from '../md/MdMenuItem.vue';

const props = defineProps<MealListItemProps>();

const emit = defineEmits<{
  'toggle-eaten': [];
  'move-up': [];
  'move-down': [];
  edit: [];
  remove: [];
}>();

const menuOpen = ref(false);

const isEaten = computed(() => props.meal.status === 'eaten');

const schedule = computed(() => {
  const parts: string[] = [];
  if (props.meal.scheduledDate === null) {
    parts.push('No date');
  } else {
    parts.push(formatIsoDateForDisplay(props.meal.scheduledDate));
  }
  if (props.meal.slot !== null) {
    parts.push(props.meal.slot);
  }
  if (isEaten.value) {
    parts.push('eaten');
  }
  return parts.join(' - ');
});

function selectEdit(): void {
  menuOpen.value = false;
  emit('edit');
}

function selectRemove(): void {
  menuOpen.value = false;
  emit('remove');
}
</script>

<template>
  <MdListItem
    :headline="props.meal.recipeNameSnapshot"
    :supporting-text="schedule"
    lines="two"
    class="meal-list-item"
    :class="{ 'meal-list-item--eaten': isEaten }"
  >
    <template #leading>
      <MdCheckbox
        :model-value="isEaten"
        :label="`Mark ${props.meal.recipeNameSnapshot} as eaten`"
        hide-label
        @update:model-value="emit('toggle-eaten')"
      />
    </template>
    <template #trailing>
      <MdIconButton
        icon="arrow_upward"
        label="Move up"
        :disabled="!props.canMoveUp"
        @click="emit('move-up')"
      />
      <MdIconButton
        icon="arrow_downward"
        label="Move down"
        :disabled="!props.canMoveDown"
        @click="emit('move-down')"
      />
      <MdMenu :open="menuOpen" label="Meal actions" @close="menuOpen = false">
        <template #trigger>
          <MdIconButton icon="more_vert" label="More actions" @click="menuOpen = !menuOpen" />
        </template>
        <MdMenuItem label="Edit schedule" icon="edit" @select="selectEdit" />
        <MdMenuItem label="Delete" icon="delete" destructive @select="selectRemove" />
      </MdMenu>
    </template>
  </MdListItem>
</template>

<style scoped>
.meal-list-item--eaten :deep(.md-list-item__headline) {
  text-decoration: line-through;
}
</style>
