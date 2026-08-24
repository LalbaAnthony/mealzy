<script setup lang="ts">
import { computed } from 'vue';
import type { MdChipProps } from '../../types/components';
import MdIcon from './MdIcon.vue';

const props = withDefaults(defineProps<MdChipProps>(), {
  variant: 'assist',
  selected: false,
  icon: null,
  removable: false,
  disabled: false,
});

defineEmits<{ click: [event: MouseEvent]; remove: [] }>();

const classes = computed(() => [
  'md-chip',
  `md-chip--${props.variant}`,
  { 'md-chip--selected': props.selected },
]);
</script>

<template>
  <span :class="classes">
    <button
      class="md-chip__body"
      type="button"
      :disabled="props.disabled"
      :aria-pressed="props.variant === 'filter' ? props.selected : undefined"
      @click="$emit('click', $event)"
    >
      <MdIcon v-if="props.icon !== null" :name="props.icon" class="md-chip__icon" />
      <span class="md-chip__label">{{ props.label }}</span>
    </button>
    <button
      v-if="props.removable"
      class="md-chip__remove"
      type="button"
      :aria-label="`Remove ${props.label}`"
      :disabled="props.disabled"
      @click="$emit('remove')"
    >
      <MdIcon name="close" class="md-chip__icon" />
    </button>
  </span>
</template>

<style scoped>
.md-chip {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: var(--md-sys-shape-corner-small);
  background-color: var(--md-sys-color-surface-container-low);
  color: var(--md-sys-color-on-surface-variant);
  overflow: hidden;
}

.md-chip--selected {
  background-color: var(--md-sys-color-secondary-container);
  color: var(--md-sys-color-on-secondary-container);
  border-color: var(--md-sys-color-secondary-container);
}

.md-chip__body,
.md-chip__remove {
  display: inline-flex;
  align-items: center;
  gap: var(--md-sys-spacing-2);
  min-block-size: var(--md-sys-size-touch-target);
  padding-inline: var(--md-sys-spacing-3);
  padding-block: var(--md-sys-spacing-1);
  border: none;
  background-color: transparent;
  color: inherit;
  font-size: var(--md-sys-typescale-label-large-size);
  line-height: var(--md-sys-typescale-label-large-line-height);
  cursor: pointer;
}

.md-chip__body:disabled,
.md-chip__remove:disabled {
  cursor: not-allowed;
  opacity: var(--md-sys-state-disabled-opacity);
}

.md-chip__icon {
  font-size: var(--md-sys-typescale-body-large-size);
}
</style>
