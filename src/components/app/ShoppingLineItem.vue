<script setup lang="ts">
import { computed, ref } from 'vue';
import type { ShoppingLineItemProps } from '../../types/components';
import { formatOptionalQuantity } from '../../domain/units/format';
import MdCheckbox from '../md/MdCheckbox.vue';
import MdChip from '../md/MdChip.vue';
import MdIconButton from '../md/MdIconButton.vue';
import MdListItem from '../md/MdListItem.vue';

const props = defineProps<ShoppingLineItemProps>();

const emit = defineEmits<{ 'toggle-purchased': [purchased: boolean] }>();

const detailsOpen = ref(false);

const quantityLabel = computed(() => formatOptionalQuantity(props.line.quantity));

const headline = computed(() =>
  quantityLabel.value === '' ? props.line.label : `${props.line.label} ${quantityLabel.value}`,
);
</script>

<template>
  <MdListItem
    :headline="headline"
    lines="one"
    class="shopping-line"
    :class="{ 'shopping-line--purchased': props.line.purchased }"
  >
    <template #leading>
      <MdCheckbox
        :model-value="props.line.purchased"
        :label="`Mark ${headline} as purchased`"
        hide-label
        @update:model-value="emit('toggle-purchased', $event)"
      />
    </template>
    <template #details>
      <ul v-if="detailsOpen" class="shopping-line__sources">
        <li v-for="label in props.sourceLabels" :key="label">
          <MdChip :label="label" variant="assist" />
        </li>
      </ul>
    </template>
    <template #trailing>
      <MdIconButton
        :icon="detailsOpen ? 'expand_less' : 'expand_more'"
        :label="
          detailsOpen
            ? `Hide why ${props.line.label} is listed`
            : `Show why ${props.line.label} is listed`
        "
        @click="detailsOpen = !detailsOpen"
      />
    </template>
  </MdListItem>
</template>

<style scoped>
.shopping-line--purchased :deep(.md-list-item__headline) {
  text-decoration: line-through;
  color: var(--md-sys-color-on-surface-variant);
}

.shopping-line__sources {
  display: flex;
  flex-wrap: wrap;
  gap: var(--md-sys-spacing-2);
  padding-block-start: var(--md-sys-spacing-1);
}
</style>
